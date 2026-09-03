# app/core/exceptions.py
class AppException(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message


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
