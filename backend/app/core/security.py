"""
Master password hashing.

We use Argon2id specifically (not bcrypt) because it's the current
OWASP recommendation and the winner of the Password Hashing Competition —
it's memory-hard, which makes GPU/ASIC cracking attempts far more
expensive than bcrypt. For a password *manager*, where the master
password is the single key protecting everything else, that extra
margin is worth the (small) dependency.

Nest analogy: comparable to wrapping `argon2` or `bcrypt` npm package
calls in an AuthService helper — same idea, just living as plain
functions here since there's no DI container to hang a service off.
"""

from datetime import datetime, timedelta, timezone
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt
from app.core.config import Settings, get_settings

_hasher = PasswordHasher()


def hash_password(plain_password: str) -> str:
    return _hasher.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return _hasher.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False


def generate_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=get_settings().jwt_access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(
        payload, get_settings().jwt_secret_key, algorithm=get_settings().jwt_algorithm
    )
