import jwt
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException, VaultNotFoundExceiption
from app.models.vault import Vault

settings = get_settings()


from fastapi import Cookie, Header, Depends


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = access_token
    if token is None and authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ")
    if token is None:
        raise UnauthorizedException()

    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException()
    except jwt.PyJWTError:
        raise UnauthorizedException()

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or user.delete_status:
        raise UnauthorizedException()

    return user


async def get_current_vault(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Vault:
    result = await db.execute(select(Vault).where(Vault.user_id == current_user.id))

    vault = result.scalar_one_or_none()
    if vault is None:
        raise VaultNotFoundExceiption()
    return vault
