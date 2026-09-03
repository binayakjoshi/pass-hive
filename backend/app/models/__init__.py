"""
Import every model here.

This is the one bit of "magic" worth flagging: Alembic's autogenerate
compares your DB schema against `Base.metadata`, but a model class only
registers itself on `Base.metadata` once Python actually imports the
module it's defined in. If you add a new model file and forget to import
it here, autogenerate will silently see no changes — not an error, just
a migration that generates empty. Nest doesn't have this gotcha because
`TypeOrmModule.forFeature([...])` forces explicit registration anyway.
"""

from app.models.user import User
from app.models.user import User

__all__ = ["User"]
from app.models.vault import Vault, VaultItem

__all__ = ["User", "Vault", "VaultItem"]
