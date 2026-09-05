import secrets
from redis.asyncio import Redis

OTP_TTL_SECONDS = 600
OTP_COOLDOWN_SECONDS = 60


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


async def issue_otp(redis: Redis, user_id: str) -> str | None:
    """Returns the OTP if issued, or None if still in cooldown."""
    if await redis.exists(f"otp_cooldown:{user_id}"):
        return None
    otp = generate_otp()
    await redis.set(f"otp:{user_id}", otp, ex=OTP_TTL_SECONDS)
    await redis.set(f"otp_cooldown:{user_id}", "1", ex=OTP_COOLDOWN_SECONDS)
    return otp


async def verify_otp(redis: Redis, user_id: str, submitted: str) -> bool:
    stored = await redis.get(f"otp:{user_id}")
    if stored is None or stored != submitted:
        return False
    await redis.delete(f"otp:{user_id}")  # one-time use
    return True


async def get_cooldown_remaining(redis: Redis, user_id: str) -> int | None:
    """Returns remaining cooldown seconds, or None if not in cooldown."""
    ttl = await redis.ttl(f"otp_cooldown:{user_id}")
    return ttl if ttl > 0 else None
