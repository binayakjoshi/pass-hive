"""
User CRUD endpoints.

Nest analogy: this file is your UsersController + UsersService merged
together. FastAPI doesn't push a controller/service split on you the
way Nest's CLI scaffolding does — for a small resource like this,
keeping DB calls right in the route handler is idiomatic. Once this
file starts doing more (permission checks, multi-step logic), that's
the natural point to peel a service layer out — not before.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.vault import Vault
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.core.security import hash_password
from app.core.deps import get_current_user
from app.core.exceptions import UserAlreadyExistsException, UserDeactivatedException

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    existing = await db.scalar(select(User).where(User.email == payload.email))

    if existing is not None:
        if existing.delete_status:
            raise UserDeactivatedException()
        raise UserAlreadyExistsException()

    user = User(
        email=payload.email,
        hashed_master_password=hash_password(payload.master_password),
    )
    db.add(user)
    await db.flush()
    new_vault = Vault(
        user_id=user.id,
        encrypted_vault_key=payload.encrypted_vault_key,
        vault_key_iv=payload.vault_key_iv,
    )
    db.add(new_vault)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if payload.email is not None:
        current_user.email = payload.email
    if payload.master_password is not None:
        current_user.hashed_master_password = hash_password(payload.master_password)

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    current_user.delete_status = True
    await db.commit()
