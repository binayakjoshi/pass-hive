"""
User CRUD endpoints.

Nest analogy: this file is your UsersController + UsersService merged
together. FastAPI doesn't push a controller/service split on you the
way Nest's CLI scaffolding does — for a small resource like this,
keeping DB calls right in the route handler is idiomatic. Once this
file starts doing more (permission checks, multi-step logic), that's
the natural point to peel a service layer out — not before.
"""

from arq import ArqRedis
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import timedelta

from app.core.queue import get_queue
from app.db.session import get_db
from app.models.user import User
from app.models.vault import Vault
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.core.security import hash_password, verify_password
from app.core.deps import get_current_user
from app.core.exceptions import (
    InvalidCredentialsException,
    UserAlreadyExistsException,
    UserDeactivatedException,
)

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


@router.patch("/users/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    is_changing_password = payload.new_master_password is not None
    is_changing_2fa = (
        payload.two_factor_enabled is not None
        and payload.two_factor_enabled != current_user.two_factor_enabled
    )

    # Re-verify server-side for anything security-sensitive — a stolen
    # session cookie alone shouldn't be able to change the password or
    # flip 2FA off. Hint-only updates skip this gate; the hint carries no
    # auth weight, so worst case a hijacked session sets a misleading hint.
    if is_changing_password or is_changing_2fa:
        if payload.current_master_password is None or not verify_password(
            payload.current_master_password, current_user.hashed_master_password
        ):
            raise InvalidCredentialsException()

    if (new_password := payload.new_master_password) is not None:
        current_user.hashed_master_password = hash_password(new_password)

        result = await db.execute(select(Vault).where(Vault.user_id == current_user.id))
        vault = result.scalar_one()

        # model_validator on UserUpdate guarantees these travel together
        # with new_master_password; asserts just narrow the type for
        # Pyright, which can't see across the validator logic.
        assert payload.encrypted_vault_key is not None
        assert payload.vault_key_iv is not None
        vault.encrypted_vault_key = payload.encrypted_vault_key
        vault.vault_key_iv = payload.vault_key_iv

    if (
        new_2fa := payload.two_factor_enabled
    ) is not None and new_2fa != current_user.two_factor_enabled:
        current_user.two_factor_enabled = new_2fa

    if payload.master_password_hint is not None:
        current_user.master_password_hint = payload.master_password_hint

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.delete("/me")
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    queue: ArqRedis = Depends(get_queue),
):
    current_user.delete_status = True
    await db.commit()
    await queue.enqueue_job(
        "hard_delete_user_job",
        str(current_user.id),
        _defer_by=timedelta(days=30),
    )
    return {"message": "Account deactivated."}
