"""POST /api/profile · GET /api/profile · PUT /api/profile — user profile management."""

from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from app.models.user import UserProfile, UserProfileCreate, UserProfileUpdate
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


@router.put("/profile", response_model=UserProfile, summary="Update an existing user profile")
async def update_profile(body: UserProfileCreate) -> UserProfile:
    """
    Update the authenticated user's profile. Accepts the full profile shape.
    Only non-None fields are updated (partial update semantics).
    """
    data = body.model_dump(exclude={"user_id"}, exclude_none=True)
    saved = await fs.upsert_user(body.user_id, data)
    return UserProfile(**saved)


@router.get("/profile", response_model=UserProfile, summary="Retrieve a user profile")
async def get_profile(user_id: str = Query(..., description="The user ID")) -> UserProfile:
    """Retrieve an existing user profile by user_id.
    Returns a default empty profile if none exists yet (avoids 404 for new users)."""
    profile = await fs.get_user(user_id)
    if profile is None:
        # Return a clean empty profile rather than 404 — the user may not have created one yet
        return UserProfile(id=user_id, name="", email="")
    return UserProfile(**profile)
