"""
App-wide settings, loaded from environment variables / .env.

Nest analogy: this plays the role of ConfigService + your .env schema,
but instead of `@Injectable()` + `ConfigModule.forRoot()`, pydantic-settings
reads and *validates* the environment for you at startup.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from enum import Enum

from typing import Literal


class Environment(str, Enum):
    DEV = "dev"
    TEST = "test"
    PROD = "prod"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Environment = Environment.DEV
    debug: bool = True

    postgres_user: str = "passhive"
    postgres_password: str = "passhive"
    postgres_db: str = "passhive"
    postgres_host: str = "db"
    postgres_port: int = 5432

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    redis_url: str = "redis://redis:6379/0"
    gmail_address: str
    gmail_app_password: str

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cookie_secure(self) -> bool:
        # only send the cookie over HTTPS in prod; dev/test run over plain http
        return self.environment == Environment.PROD

    @property
    def cookie_samesite(self) -> Literal["lax", "none"]:
        # "lax" is fine once frontend/api share a domain in prod.
        # Use "none" only for cross-site cookies (requires Secure=True).
        return "lax"


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.

    Nest analogy: like injecting a singleton ConfigService — @lru_cache
    means this only gets constructed once per process, then reused.
    """
    return Settings()  # type: ignore[call-arg]
