"""
User model.

Nest/TypeORM analogy:

    @Entity()
    class User {
      @PrimaryGeneratedColumn('uuid') id: string;
      @Column({ unique: true }) email: string;
      @Column() hashedPassword: string;
      @CreateDateColumn() createdAt: Date;
    }

SQLAlchemy 2.0's `Mapped[...]` + `mapped_column(...)` is the direct
equivalent of `@Column()` — type hints double as the column type,
the same way FastAPI route params double as validation.

Naming note: this stores the hash of the user's *master* password —
the one thing pass-hive should never store in plaintext or reverse.
Individual vault item secrets (the passwords being managed) will live
in their own encrypted model later, not here.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func, Boolean, null, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_master_password: Mapped[str] = mapped_column(String(255), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    delete_status: Mapped[bool] = mapped_column(Boolean, server_default="false")

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None, nullable=True
    )
    verification_status: Mapped[bool] = mapped_column(Boolean, server_default="false")

    master_password_hint: Mapped[str | None] = mapped_column(String(255), nullable=True)

    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, server_default="false")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
