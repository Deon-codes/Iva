"""
Pydantic models for User data.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserProfile(BaseModel):
    """Firestore users/{userId} document shape."""

    id: str
    name: str
    email: str
    # Demographic fields used by Discovery Agent for eligibility matching
    state: Optional[str] = None
    age: Optional[int] = None
    annual_income_inr: Optional[int] = None          # household annual income
    education_level: Optional[str] = None            # e.g. "12th", "UG", "PG"
    caste_category: Optional[str] = None             # General / OBC / SC / ST
    gender: Optional[str] = None
    disability: Optional[bool] = False
    institution_name: Optional[str] = None
    course_name: Optional[str] = None
    # Status
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserProfileCreate(BaseModel):
    """Request body for POST /api/profile."""

    user_id: str
    name: str
    email: str
    state: Optional[str] = None
    age: Optional[int] = None
    annual_income_inr: Optional[int] = None
    education_level: Optional[str] = None
    caste_category: Optional[str] = None
    gender: Optional[str] = None
    disability: Optional[bool] = False
    institution_name: Optional[str] = None
    course_name: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Partial update payload."""

    name: Optional[str] = None
    state: Optional[str] = None
    age: Optional[int] = None
    annual_income_inr: Optional[int] = None
    education_level: Optional[str] = None
    caste_category: Optional[str] = None
    gender: Optional[str] = None
    disability: Optional[bool] = None
    institution_name: Optional[str] = None
    course_name: Optional[str] = None
