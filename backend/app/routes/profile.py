"""POST /api/profile · GET /api/profile — user profile management."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.user import UserProfile, UserProfileCreate
from app.services import firestore_service as fs

router = APIRouter(prefix="/api", tags=["profile"])
logger = logging.getLogger(__name__)


@router.post("/profile", response_model=UserProfile, status_code=201, summary="Create or update a user profile")
async def create_profile(body: UserProfileCreate) -> UserProfile:
    """
    Create or update a user profile.
    Profile data (state, income, caste, education) is used by the Discovery Agent for eligibility matching.
    """
    data = body.model_dump(exclude={"user_id"})
    saved = await fs.upsert_user(body.user_id, data)
    return UserProfile(**saved)


@router.get("/profile", response_model=UserProfile, summary="Retrieve a user profile")
async def get_profile(user_id: str = Query(..., description="The user ID")) -> UserProfile:
    """Retrieve an existing user profile by user_id."""
    profile = await fs.get_user(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"User profile '{user_id}' not found.")
    return UserProfile(**profile)
