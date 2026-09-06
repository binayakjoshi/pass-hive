from pydantic import BaseModel, EmailStr, Field


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


class Verify2FARequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class RequestHintSchema(BaseModel):
    email: EmailStr
