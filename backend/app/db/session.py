"""
Database engine + session factory.

Nest analogy: this is roughly your TypeOrmModule.forRoot() config plus
the DataSource — SQLAlchemy's AsyncSession is comparable to a TypeORM
Repository/EntityManager combo, but you construct queries with SQLAlchemy's
own query builder (or raw SQL) rather than decorators on entity classes.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=settings.debug, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a DB session per request.

    Nest analogy: like a request-scoped provider that gives you an
    injected repository — except here you declare it explicitly per
    route with `db: AsyncSession = Depends(get_db)` instead of
    constructor injection.
    """
    async with AsyncSessionLocal() as session:
        yield session
