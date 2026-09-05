"""
Health check endpoint — confirms the API is up and can reach Postgres.

Nest analogy: like a bare @Controller('health') with one @Get() handler.
FastAPI's APIRouter plays the role of Nest's Controller, and you wire it
into the app in main.py the way you'd register a module in AppModule.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis
from redis.asyncio import Redis
from fastapi import Depends
from app.db.session import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check() -> dict:
    return {"status": "ok"}


@router.get("/db")
async def health_check_db(db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(text("SELECT 1"))
    result.scalar_one()
    return {"status": "ok", "database": "connected"}


@router.get("/redis")
async def health_redis(redis: Redis = Depends(get_redis)):
    pong = await redis.ping()
    return {"redis": "ok" if pong else "unreachable"}
