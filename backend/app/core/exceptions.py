from typing import Optional, Any

class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: Optional[Any] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)

class InvalidCredentialsException(AppException):
    def __init__(self, message: str = "Invalid email or password."):
        super().__init__(code="INVALID_CREDENTIALS", message=message, status_code=401)

class AccountAlreadyExistsException(AppException):
    def __init__(self, message: str = "An account with this email or username already exists."):
        super().__init__(code="ACCOUNT_ALREADY_EXISTS", message=message, status_code=400)

class UnauthorizedException(AppException):
    def __init__(self, message: str = "Authentication credentials were not provided or are invalid."):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)

class NotFoundException(AppException):
    def __init__(self, message: str = "Requested resource not found."):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)
