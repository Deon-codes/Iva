"""
Profile tools — ADK tool functions for reading and updating user profiles.
Used by the Discovery Agent (to understand the user) and Form-Prep Agent (to fill forms).

User identity is automatically injected by the ADK framework via tool_context.user_id.
Tools do NOT need Gemini to pass user_id as an argument.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.services import firestore_service as fs

try:
    from google.adk.tools.tool_context import ToolContext as _ToolContext
except ImportError:
    _ToolContext = None  # type: ignore[misc,assignment]

logger = logging.getLogger(__name__)


def _get_uid(tool_context: Any = None, user_id: str = "") -> str:
    """Get user_id from ADK ToolContext (trusted, framework-injected) or fallback."""
    if tool_context is not None and getattr(tool_context, "user_id", None):
        return tool_context.user_id
    return user_id


# Type alias: ToolContext when ADK is available, otherwise Any
_Tc = _ToolContext if _ToolContext is not None else Any


async def get_user_profile(
    user_id: str = "",
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> Optional[Dict[str, Any]]:
    """
    Retrieve the full profile of a user from Firestore.

    The user identity is automatically injected by the ADK framework.
    You do NOT need to pass user_id explicitly.

    Returns:
        User profile dict, or None if the user does not exist.
    """
    uid = _get_uid(tool_context, user_id)
    profile = await fs.get_user(uid)
    if profile is None:
        logger.info("User profile not found for user_id=%s", uid)
    return profile


async def update_user_profile(
    user_id: str = "",
    updates: Dict[str, Any] = None,
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> Dict[str, Any]:
    """
    Update specific fields of a user's profile.

    The user identity is automatically injected by the ADK framework.

    Args:
        updates: Dict of fields to update (partial update).

    Returns:
        Updated user profile dict.
    """
    uid = _get_uid(tool_context, user_id)
    return await fs.upsert_user(uid, updates or {})


async def get_profile_completeness(
    user_id: str = "",
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> Dict[str, Any]:
    """
    Check how complete the user's profile is for scholarship applications.

    The user identity is automatically injected by the ADK framework.

    Returns:
        Dict with complete_fields, missing_fields, completeness_pct,
        ready_for_eligibility_check.
    """
    uid = _get_uid(tool_context, user_id)
    profile = await fs.get_user(uid)
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
        "ready_for_eligibility_check": len(missing) <= 2,
    }
