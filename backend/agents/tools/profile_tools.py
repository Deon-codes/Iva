"""
Profile tools — ADK tool functions for reading and updating user profiles.
Used by the Discovery Agent (to understand the user) and Form-Prep Agent (to fill forms).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.services import firestore_service as fs

logger = logging.getLogger(__name__)


async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the full profile of a user from Firestore.

    Args:
        user_id: The unique user identifier.

    Returns:
        User profile dict, or None if the user does not exist.
        Contains: name, email, state, age, annual_income_inr, education_level,
                  caste_category, gender, institution_name, course_name.
    """
    profile = await fs.get_user(user_id)
    if profile is None:
        logger.info("User profile not found for user_id=%s", user_id)
    return profile


async def update_user_profile(user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update specific fields of a user's profile.

    Args:
        user_id: The unique user identifier.
        updates: Dict of fields to update (partial update — only provided fields change).

    Returns:
        Updated user profile dict.
    """
    return await fs.upsert_user(user_id, updates)


async def get_profile_completeness(user_id: str) -> Dict[str, Any]:
    """
    Check how complete the user's profile is for scholarship applications.

    Args:
        user_id: The unique user identifier.

    Returns:
        Dict with:
            - complete_fields (list of str)
            - missing_fields (list of str)
            - completeness_pct (float 0-100)
            - ready_for_eligibility_check (bool)
    """
    profile = await fs.get_user(user_id)
    eligibility_fields = [
        "name", "email", "state", "age", "annual_income_inr",
        "education_level", "caste_category", "gender",
        "institution_name", "course_name",
    ]
    if profile is None:
        return {
            "complete_fields": [],
            "missing_fields": eligibility_fields,
            "completeness_pct": 0.0,
            "ready_for_eligibility_check": False,
        }

    complete = [f for f in eligibility_fields if profile.get(f) is not None]
    missing = [f for f in eligibility_fields if profile.get(f) is None]
    pct = len(complete) / len(eligibility_fields) * 100

    return {
        "complete_fields": complete,
        "missing_fields": missing,
        "completeness_pct": round(pct, 1),
        "ready_for_eligibility_check": len(missing) <= 2,  # allow up to 2 optional fields missing
    }
