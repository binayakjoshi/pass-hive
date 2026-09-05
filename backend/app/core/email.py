import aiosmtplib
from email.mime.text import MIMEText
from app.core.config import get_settings

settings = get_settings()


async def send_otp_email(to_email: str, otp: str) -> None:
    msg = MIMEText(f"Your verification code is: {otp}\nExpires in 10 minutes.")
    msg["Subject"] = "Your pass-hive verification code"
    msg["From"] = settings.gmail_address
    msg["To"] = to_email

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.gmail_address,
        password=settings.gmail_app_password,
    )
