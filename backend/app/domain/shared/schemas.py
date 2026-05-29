import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.shared.models import UserRole, WalletType


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: UserRole = UserRole.requester


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class WalletAddRequest(BaseModel):
    address: str = Field(..., pattern=r"^0x[0-9a-fA-F]{40}$")
    wallet_type: WalletType = WalletType.requester
    chain_id: int = 2910


class WalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    address: str
    wallet_type: WalletType
    chain_id: int
    created_at: datetime


class SourceConnectorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    source_type: str
    allowed_fields: list
    rate_limit_per_minute: int
    compliance_notes: str
    is_active: bool
    created_at: datetime
