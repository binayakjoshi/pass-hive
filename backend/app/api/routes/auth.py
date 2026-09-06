from arq import ArqRedis
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core import queue
from app.core.config import get_settings
from app.core.otp import OTP_TTL_SECONDS, get_cooldown_remaining, issue_otp, verify_otp
from app.core.security import verify_password, generate_access_token
from app.db.redis import get_redis
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    ResendOtpRequest,
    VerifyOtpRequest,
    Verify2FARequest,
    RequestHintSchema,
)
from app.core.exceptions import (
    AccountPendingReactivationException,
    InvalidCredentialsException,
    InvalidOtpException,
    OtpCooldownException,
    UserNotVerifiedException,
    TwoFactorRequiredException,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_auth_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    queue: ArqRedis = Depends(queue.get_queue),
):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.master_password, user.hashed_master_password):
        raise InvalidCredentialsException()

    if user.delete_status:
        if not payload.confirm_reactivation:
            raise AccountPendingReactivationException()
        user.delete_status = False

    if not user.verification_status:
        otp = await issue_otp(redis, str(user.id))
        if otp is not None:
            await queue.enqueue_job("send_otp_email_job", user.email, otp)
        raise UserNotVerifiedException(otp_expires_in=OTP_TTL_SECONDS)

    if user.two_factor_enabled:
        otp = await issue_otp(redis, str(user.id), namespace="2fa_otp")
        if otp is not None:
            await queue.enqueue_job("send_otp_email_job", user.email, otp)
        # Same "swallow cooldown silently" pattern as verification OTP —
        # a code was already sent recently, so the response is identical
        # either way. Critically, this must raise: without it, 2FA is
        # bypassed and login proceeds unauthenticated-by-2FA.
        raise TwoFactorRequiredException(otp_expires_in=OTP_TTL_SECONDS)

    access_token = generate_access_token(subject=str(user.id))
    await db.commit()
    _set_auth_cookie(response, access_token)
    return {"success": True}


@router.post("/verify-otp")
async def verify_otp_route(
    payload: VerifyOtpRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    result = await db.execute(
        select(User).where(User.email == payload.email, User.delete_status == False)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise InvalidOtpException()  # don't leak existence via a different error

    ok = await verify_otp(redis, str(user.id), payload.otp)
    if not ok:
        raise InvalidOtpException()

    user.verification_status = True
    await db.commit()
    return {"message": "Account verified successfully."}


@router.post("/resend-otp")
async def resend_otp_route(
    payload: ResendOtpRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    queue: ArqRedis = Depends(queue.get_queue),
):
    result = await db.execute(
        select(User).where(User.email == payload.email, User.delete_status == False)
    )
    user = result.scalar_one_or_none()

    if user is None or user.verification_status:
        return {"message": "If an account exists, a new code has been sent."}

    cooldown = await get_cooldown_remaining(redis, str(user.id))
    if cooldown is not None:
        raise OtpCooldownException(cooldown_seconds=cooldown)

    otp = await issue_otp(redis, str(user.id))
    if otp is not None:
        await queue.enqueue_job("send_otp_email_job", user.email, otp)

    return {"message": "A new code has been sent.", "data": {"otp_expires_in": OTP_TTL_SECONDS}}


@router.post("/verify-2fa")
async def verify_2fa(
    payload: Verify2FARequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise InvalidOtpException()

    if not await verify_otp(redis, str(user.id), payload.otp, namespace="2fa_otp"):
        raise InvalidOtpException()

    access_token = generate_access_token(subject=str(user.id))
    _set_auth_cookie(response, access_token)
    return {"success": True}


@router.post("/request-hint")
async def request_hint(
    payload: RequestHintSchema,
    db: AsyncSession = Depends(get_db),
    queue: ArqRedis = Depends(queue.get_queue),
):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user and user.master_password_hint:
        await queue.enqueue_job("send_hint_email_job", user.email, user.master_password_hint)
    return {"message": "If an account with a hint exists, it has been emailed."}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "access_token",
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return {"success": True}
