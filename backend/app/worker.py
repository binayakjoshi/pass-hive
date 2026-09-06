import logging
from arq.connections import RedisSettings
from sqlalchemy import delete, select

from app.core.config import get_settings
from app.core.email import send_otp_email
from app.core.otp import OTP_TTL_SECONDS
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.vault import Vault, VaultItem

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_otp_email_job(ctx, to_email: str, otp: str) -> None:
    await send_otp_email(to_email, otp, expires_in_minutes=OTP_TTL_SECONDS // 60)


async def hard_delete_user_job(ctx, user_id: str) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        # Idempotent guard: the user may have been reactivated (delete_status
        # flipped back to False) any time in the 30 days since this job was
        # scheduled — no separate cancellation path needed, this check *is*
        # the cancellation.
        if user is None or not user.delete_status:
            logger.info("Skipping hard delete for %s — not found or reactivated", user_id)
            return

        vault_result = await db.execute(select(Vault).where(Vault.user_id == user.id))
        vault = vault_result.scalar_one_or_none()
        if vault is not None:
            await db.execute(delete(VaultItem).where(VaultItem.vault_id == vault.id))
            await db.execute(delete(Vault).where(Vault.id == vault.id))

        await db.execute(delete(User).where(User.id == user.id))
        await db.commit()
        logger.info("Hard-deleted user %s and their vault (30-day window elapsed)", user_id)


class WorkerSettings:
    functions = [send_otp_email_job, hard_delete_user_job]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
