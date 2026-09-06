from email.message import EmailMessage
import aiosmtplib

from app.core.config import get_settings
from app.core.email_templates import render_otp_email, render_otp_email_plaintext

settings = get_settings()


async def send_otp_email(to_email: str, otp: str, expires_in_minutes: int = 10) -> None:
    message = EmailMessage()
    message["Subject"] = "Your Pass Hive verification code"
    message["From"] = settings.gmail_address
    message["To"] = to_email

    # Plain text fallback
    message.set_content(render_otp_email_plaintext(otp, expires_in_minutes))

    # HTML version
    message.add_alternative(
        render_otp_email(otp, expires_in_minutes),
        subtype="html",
    )

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.gmail_address,
        password=settings.gmail_app_password,
    )
