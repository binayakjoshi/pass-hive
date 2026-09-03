from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, generate_access_token
from app.core.exceptions import InvalidCredentialsException

router = APIRouter(prefix="/auth", tags=["auth"])


from fastapi import APIRouter, Depends, Response
from app.core.config import get_settings

settings = get_settings()


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == payload.email, User.delete_status == False)
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.master_password, user.hashed_master_password):
        raise InvalidCredentialsException()

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


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "access_token",
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return {"success": True}
