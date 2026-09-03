"""
Declarative base class that all ORM models inherit from.

Nest analogy: comparable to the base your @Entity() classes implicitly
share via TypeORM's decorators — here it's a plain Python class instead
of decorator metadata.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
