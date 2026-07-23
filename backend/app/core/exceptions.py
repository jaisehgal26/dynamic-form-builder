class AppError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


class AuthError(AppError):
    def __init__(self, message: str = "Unauthorized", status: int = 401):
        super().__init__(message, status)
