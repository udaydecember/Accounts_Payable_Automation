from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'
    user: 'UserResponse'

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    department: Optional[str] = 'Finance'
    approval_limit: Optional[str] = '0'
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    roles: List[str] = ['ap_executive']

class RoleResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: str
    roles: List[RoleResponse] = []
    created_at: datetime
    class Config:
        from_attributes = True

Token.model_rebuild()
