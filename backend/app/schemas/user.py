"""
Request/response schemas for User.

Nest analogy: these are your DTOs — CreateUserDto / UserResponseDto —
except in FastAPI, the *same* mechanism that validates incoming JSON
(class-validator's job in Nest) also serializes outgoing responses.
Osecret latinane system instead of two.

Deliberately three separate classes, not one reused everywhere:
- UserCreate: what a client is allowed to SEND. Has the plaintext
  master password (only ever exists in memory for the instant it takes
  to hash it — never stored, never logged, never returned).
- UserRead: what a client is allowed to RECEIVE. No password field
  of any kind — not plaintext, not hashed. Leaking the hash back over
  the API would hand an attacker a head start on offline cracking.
- UserUpdate: partial update — every field optional.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    master_password: str
    encrypted_vault_key: str
    vault_key_iv: str


class UserUpdate(BaseModel):
    current_master_password: str | None = None
    new_master_password: str | None = None
    encrypted_vault_key: str | None = None
    vault_key_iv: str | None = None
    master_password_hint: str | None = None
    two_factor_enabled: bool | None = None

    @model_validator(mode="after")
    def validate_pairing(self) -> "UserUpdate":
        # Same ciphertext/IV pairing rule as VaultItemUpdate — a password
        # change always produces a new wrapped vault key, so one without
        # the other is invalid.
        if bool(self.new_master_password) != bool(self.encrypted_vault_key and self.vault_key_iv):
            raise ValueError(
                "new_master_password requires both encrypted_vault_key and vault_key_iv"
            )
        return self


class UserRead(BaseModel):
    # Lets Pydantic build this straight from a SQLAlchemy User instance
    # (attribute access) instead of requiring a dict — like class-transformer's
    # plainToInstance, but automatic.
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime
