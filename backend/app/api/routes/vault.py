import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_vault
from app.core.exceptions import VaultItemNotFoundExceiption
from app.db.session import get_db
from app.models.vault import Vault, VaultItem
from app.schemas.vault import VaultItemCreate, VaultItemRead, VaultItemUpdate, VaultRead


router = APIRouter(prefix="/vaults", tags=["vaults"])


@router.get("/items", response_model=list[VaultItemRead])
async def list_items(
    vault: Vault = Depends(get_current_vault),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VaultItem).where(
            VaultItem.vault_id == vault.id,
            VaultItem.delete_status == False,
        )
    )
    return result.scalars().all()


@router.get("/items/{item_id}", response_model=VaultItemRead)
async def get_item(
    item_id: uuid.UUID,
    vault: Vault = Depends(get_current_vault),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned_item(db, vault.id, item_id)
    return item


@router.get("/current", response_model=VaultRead)
async def get_current_user_vault(vault: Vault = Depends(get_current_vault)):
    return vault


@router.post("/items", response_model=VaultItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: VaultItemCreate,
    vault: Vault = Depends(get_current_vault),
    db: AsyncSession = Depends(get_db),
):
    item = VaultItem(vault_id=vault.id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=VaultItemRead)
async def update_item(
    item_id: uuid.UUID,
    payload: VaultItemUpdate,
    vault: Vault = Depends(get_current_vault),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned_item(db, vault.id, item_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    vault: Vault = Depends(get_current_vault),
    db: AsyncSession = Depends(get_db),
):
    item = await _get_owned_item(db, vault.id, item_id)
    item.delete_status = True
    await db.commit()


async def _get_owned_item(db: AsyncSession, vault_id: uuid.UUID, item_id: uuid.UUID) -> VaultItem:
    result = await db.execute(
        select(VaultItem).where(
            VaultItem.id == item_id,
            VaultItem.vault_id == vault_id,
            VaultItem.delete_status == False,
        )
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise VaultItemNotFoundExceiption()
    return item
