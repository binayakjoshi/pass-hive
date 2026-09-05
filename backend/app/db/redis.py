from redis.asyncio import Redis, ConnectionPool
from app.core.config import get_settings

settings = get_settings()

redis_pool = ConnectionPool.from_url(
    settings.redis_url,
    decode_responses=True,  # get str back instead of bytes — you'll want this for OTP codes
)


def get_redis() -> Redis:
    return Redis(connection_pool=redis_pool)
