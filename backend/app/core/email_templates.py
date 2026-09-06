def render_otp_email(otp: str, expires_in_minutes: int = 10) -> str:
    digits_html = "".join(
        f'<td style="padding:0 4px;">'
        f'<div style="width:40px;height:48px;background-color:#F7F6F2;'
        f"border:1px solid #A3B899;border-radius:8px;"
        f"font-family:Roboto,Arial,sans-serif;font-size:22px;"
        f'font-weight:600;color:#1B1D18;text-align:center;line-height:48px;">'
        f"{digit}</div></td>"
        for digit in otp
    )

    return f"""\
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your account</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F6F2;font-family:Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F6F2;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="420" cellpadding="0" cellspacing="0"
               style="background-color:#FFFFFF;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color:#7C9473;padding:28px 32px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:0.3px;">
                🐝 Pass Hive
              </span>
            </td>
          </tr>

          <!-- Accent stripe -->
          <tr>
            <td style="background-color:#D9C89E;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#1B1D18;">
                Verify your account
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;color:#6B6E64;line-height:1.5;">
                Enter this code to finish signing in. It expires in {expires_in_minutes} minutes.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
                <tr>
                  {digits_html}
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#9A9D91;line-height:1.5;">
                Didn't request this code? You can safely ignore this email —
                your account is still secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#F7F6F2;border-top:1px solid #EAE8E1;text-align:center;">
              <p style="margin:0;font-size:11px;color:#A6A99D;">
                Pass Hive never asks for your master password by email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def render_otp_email_plaintext(otp: str, expires_in_minutes: int = 10) -> str:
    """Plain-text fallback — required for deliverability (spam filters
    penalize HTML-only emails) and for plaintext-only mail clients."""
    return (
        f"Your Pass Hive verification code is: {otp}\n\n"
        f"This code expires in {expires_in_minutes} minutes.\n\n"
        f"Didn't request this? You can safely ignore this email."
    )
