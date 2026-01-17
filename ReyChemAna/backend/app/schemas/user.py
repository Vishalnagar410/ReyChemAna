# backend/app/schemas/user.py
"""
User schemas (Pydantic v2 compatible)
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr
from pydantic import ConfigDict

from app.models.user import UserRole


# ============================================================
# 🔹 BASE USER SCHEMA
# ============================================================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool = True


# ============================================================
# 🔹 CREATE USER (ADMIN)
# ============================================================

class UserCreate(UserBase):
    password: str


# ============================================================
# 🔹 UPDATE USER (ADMIN)
# ============================================================

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ============================================================
# 🔹 RESPONSE USER (CRITICAL FIX HERE)
# ============================================================

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # ✅ REQUIRED FOR SQLALCHEMY → PYDANTIC (v2)
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# 🔹 PAGINATED USER LIST
# ============================================================

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int
