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

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    master_password: str
    encrypted_vault_key: str
    vault_key_iv: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    master_password: str | None = Field(default=None, min_length=8, max_length=256)


class UserRead(BaseModel):
    # Lets Pydantic build this straight from a SQLAlchemy User instance
    # (attribute access) instead of requiring a dict — like class-transformer's
    # plainToInstance, but automatic.
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime
