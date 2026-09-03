import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator

from app.models.vault import VaultItemType


class VaultItemBase(BaseModel):
    type: VaultItemType
    encrypted_title: str
    title_iv: str
    encrypted_data: str
    data_iv: str
    favorite: bool = False
    delete_status: bool = False


class VaultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    encrypted_vault_key: str
    vault_key_iv: str
    created_at: datetime


class VaultItemCreate(VaultItemBase):
    pass


class VaultItemUpdate(BaseModel):
    encrypted_title: str | None = None
    title_iv: str | None = None
    encrypted_data: str | None = None
    data_iv: str | None = None
    favorite: bool | None = None

    @model_validator(mode="after")
    def check_ciphertext_iv_pairs(self) -> "VaultItemUpdate":
        title_fields = (self.encrypted_title, self.title_iv)
        if any(title_fields) and not all(title_fields):
            raise ValueError("encrypted_title and title_iv must be provided together")

        data_fields = (self.encrypted_data, self.data_iv)
        if any(data_fields) and not all(data_fields):
            raise ValueError("encrypted_data and data_iv must be provided together")

        return self


class VaultItemRead(VaultItemBase):
    # auto load from the db no need to create dict
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
