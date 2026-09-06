from arq import create_pool
from arq.connections import RedisSettings, ArqRedis
from app.core.config import get_settings

_pool: ArqRedis | None = None


async def get_arq_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    return _pool


async def close_arq_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def get_queue() -> ArqRedis:
    """FastAPI dependency — mirrors get_redis()'s shape."""
    return await get_arq_pool()
