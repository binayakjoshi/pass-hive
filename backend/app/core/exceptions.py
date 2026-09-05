class AppException(Exception):
    def __init__(self, status_code: int, code: str, message: str, data: dict | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.data = data  # NEW — optional extra payload for the client
        super().__init__(message)


class UserNotVerifiedException(AppException):
    def __init__(self, otp_expires_in: int):
        super().__init__(
            status_code=403,
            code="USER_NOT_VERIFIED",
            message="Please verify your account via the OTP sent to your email.",
            data={"otp_expires_in": otp_expires_in},
        )


class UserNotFoundException(AppException):
    def __init__(self, user_id: str):
        super().__init__(404, "USER_NOT_FOUND", f"User {user_id} not found")


class InvalidCredentialsException(AppException):
    def __init__(self):
        super().__init__(401, "INVALID_CREDENTIALS", "Invalid email or password")


class UnauthorizedException(AppException):
    def __init__(self):
        super().__init__(401, "UNAUTHORIZED", "Could not validate credentials")


class UserAlreadyExistsException(AppException):
    def __init__(self):
        super().__init__(409, "USER_ALREADY_EXISTS", "A user with this email already exists.")


class UserDeactivatedException(AppException):
    def __init__(self):
        super().__init__(
            409,
            "USER_DEACTIVATED",
            "An account with this email was deactivated. Please reactivate instead of creating a new account.",
        )


class VaultNotFoundExceiption(AppException):
    def __init__(self):
        super().__init__(404, "VAULT_NOT_FOUND", "Vault not found for current user.")


class VaultItemNotFoundExceiption(AppException):
    def __init__(self):
        super().__init__(404, "VAULT_ITEM_NOT_FOUND", "Vault item not found for current user.")


class InvalidOtpException(AppException):
    def __init__(self):
        super().__init__(400, "INVALID_OTP", "Invalid or expired otp.")


class OtpCooldownException(AppException):
    def __init__(self, cooldown_seconds: int):
        super().__init__(
            status_code=429,
            code="OTP_COOLDOWN",
            message="Please wait before requesting another code.",
            data={"cooldown_seconds": cooldown_seconds},
        )
