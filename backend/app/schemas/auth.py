from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    master_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
