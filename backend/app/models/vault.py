import enum
import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class VaultItemType(str, enum.Enum):
    LOGIN = "login"
    CARD = "card"
    NOTE = "note"
    IDENTITY = "identity"
    SSH_KEY = "ssh_key"


class Vault(Base):
    __tablename__ = "vaults"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    encrypted_vault_key: Mapped[str] = mapped_column(Text, nullable=False)
    vault_key_iv: Mapped[str] = mapped_column(String(64), nullable=False)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    items: Mapped[list["VaultItem"]] = relationship(
        back_populates="vault", cascade="all, delete-orphan"
    )


class VaultItem(Base):
    __tablename__ = "vault_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vault_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vaults.id"), nullable=False, index=True
    )
    type: Mapped[VaultItemType] = mapped_column(
        SAEnum(VaultItemType, name="vault_item_type"), nullable=False
    )

    # Encrypted blobs — server never sees plaintext for either of these.
    encrypted_title: Mapped[str] = mapped_column(Text, nullable=False)
    title_iv: Mapped[str] = mapped_column(String(64), nullable=False)

    encrypted_data: Mapped[str] = mapped_column(Text, nullable=False)
    data_iv: Mapped[str] = mapped_column(String(64), nullable=False)

    favorite: Mapped[bool] = mapped_column(default=False, server_default="false")

    delete_status: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    vault: Mapped["Vault"] = relationship(back_populates="items")
