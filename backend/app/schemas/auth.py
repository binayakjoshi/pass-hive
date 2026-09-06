from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    master_password: str
    confirm_reactivation: bool = False


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


class ResendOtpRequest(BaseModel):
    email: EmailStr
