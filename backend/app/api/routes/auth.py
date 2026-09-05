from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.email import send_otp_email
from app.core.otp import OTP_TTL_SECONDS, get_cooldown_remaining, issue_otp, verify_otp
from redis.asyncio import Redis
from app.db.redis import get_redis
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, ResendOtpRequest, VerifyOtpRequest
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, generate_access_token
from app.core.exceptions import (
    InvalidCredentialsException,
    InvalidOtpException,
    OtpCooldownException,
    UserNotVerifiedException,
)

router = APIRouter(prefix="/auth", tags=["auth"])


from fastapi import APIRouter, Depends, Response
from app.core.config import get_settings

settings = get_settings()


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    result = await db.execute(
        select(User).where(User.email == payload.email, User.delete_status == False)
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.master_password, user.hashed_master_password):
        raise InvalidCredentialsException()

    if not user.verification_status:
        otp = await issue_otp(redis, str(user.id))
        if otp is not None:
            await send_otp_email(user.email, otp)
        raise UserNotVerifiedException(otp_expires_in=600)

    access_token = generate_access_token(subject=str(user.id))
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )
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
    return {"message": "Account verified sucessfully."}


@router.post("/resend-otp")
async def resend_otp_route(
    payload: ResendOtpRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    result = await db.execute(
        select(User).where(User.email == payload.email, User.delete_status == False)
    )
    user = result.scalar_one_or_none()

    # Don't reveal whether the account exists or is already verified —
    # same generic response either way. Frontend just shows "code sent"
    # and lets the (already-visible) countdown be the real signal.
    if user is None or user.verification_status:
        return {"message": "If an account exists, a new code has been sent."}

    cooldown = await get_cooldown_remaining(redis, str(user.id))
    if cooldown is not None:
        raise OtpCooldownException(cooldown_seconds=cooldown)

    otp = await issue_otp(redis, str(user.id))
    if otp is not None:
        await send_otp_email(user.email, otp)

    return {"message": "A new code has been sent.", "data": {"otp_expires_in": OTP_TTL_SECONDS}}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "access_token",
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return {"success": True}
