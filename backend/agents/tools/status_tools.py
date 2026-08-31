"""
Status tools — check application status by application_id or scheme_id.

Supports two resolution paths:
  1. Direct: application_id provided → look up directly
  2. By scheme: scheme_id provided → find user's application for that scheme

User identity is injected via ADK ToolContext (tool_context.user_id).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from app.services import firestore_service as fs
from app.services.pubsub_service import publish_status_check_trigger

try:
    from google.adk.tools.tool_context import ToolContext as _ToolContext
except ImportError:
    _ToolContext = None  # type: ignore[misc,assignment]

logger = logging.getLogger(__name__)

_Tc = _ToolContext if _ToolContext is not None else Any


def _get_uid(tool_context: Any = None, user_id: str = "") -> str:
    """Get user_id from ADK ToolContext (trusted) or fallback."""
    if tool_context is not None and getattr(tool_context, "user_id", None):
        return tool_context.user_id
    return user_id


async def check_application_status(
    application_id: str = "",
    scheme_id: str = "",
    user_id: str = "",
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> Dict[str, Any]:
    """
    Check and return the current status of an application.

    Supports two modes:
      - application_id: direct lookup (legacy)
      - scheme_id: resolves the user's application for that scheme

    The user identity is automatically injected by the ADK framework.
    You do NOT need to pass user_id explicitly.

    Args:
        application_id: The application identifier (if known).
        scheme_id: The scheme identifier (to find user's application).

    Returns:
        Dict with application_id, status, nextAction, etc.
    """
    uid = _get_uid(tool_context, user_id)
    resolved_app_id = application_id

    # If no application_id but scheme_id is provided, resolve via user's applications
    if not resolved_app_id and scheme_id and uid:
        apps = await fs.list_applications_for_user(uid)
        matching = [a for a in apps if a.get("schemeId") == scheme_id]
        if matching:
            resolved_app_id = matching[0].get("id", "")
        else:
            return {
                "found": False,
                "scheme_id": scheme_id,
                "message": (
                    f"No application has been prepared for this scheme yet. "
                    f"Would you like me to prepare one?"
                ),
            }

    if not resolved_app_id:
        return {
            "found": False,
            "message": "Please specify which application you want to check, or provide the scheme name.",
        }

    application = await fs.get_application(resolved_app_id)
    if application is None:
        return {
            "found": False,
            "application_id": resolved_app_id,
            "error": "Application not found.",
            "pubsub_triggered": False,
        }

    # Verify user ownership
    if uid and application.get("userId") != uid:
        return {
            "found": False,
            "error": "You do not have access to this application.",
        }

    # Publish async trigger for deeper status checks
    pubsub_triggered = await publish_status_check_trigger(resolved_app_id)

    return {
        "found": True,
        "application_id": resolved_app_id,
        "scheme_id": application.get("schemeId"),
        "scheme_name": application.get("schemeName"),
        "status": application.get("status"),
        "nextAction": application.get("nextAction"),
        "rejectionReason": application.get("rejectionReason"),
        "submittedAt": application.get("submittedAt"),
        "pubsub_triggered": pubsub_triggered,
    }
