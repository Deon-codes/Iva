"""
Mock Government Portal — simulates filling a government scholarship application form.

This is used during the demo to show the Form-Prep Agent filling a realistic form.
It NEVER connects to any real government website.

Design intent (AGENTS.md):
  "Use a realistic mock government portal for the demo —
   do not live-automate a real one."
"""

from __future__ import annotations

import uuid
import logging
from datetime import datetime
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Simulated portal sessions (in-memory for demo)
_portal_sessions: Dict[str, Dict[str, Any]] = {}


async def fill_mock_portal(
    user_id: str,
    scheme_id: str,
    form_fields: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Simulate filling a government scholarship application portal with the prepared form data.
    Always stops before OTP / identity verification / final submission.

    Args:
        user_id: The user who owns this application.
        scheme_id: The scheme being applied for.
        form_fields: Dict of field names → values (from prepare_form_fields).

    Returns:
        Dict with:
            - session_id (str): Mock portal session identifier for the demo.
            - review_url (str): URL to the mock review page (for demo display).
            - filled_fields (dict): The fields that were populated.
            - missing_fields (list): Fields that could not be auto-filled.
            - hard_stop_message (str): Message explaining the OTP/submission stop.
            - portal_status (str): "ready_for_review" (never "submitted").
            - timestamp (str): When the form was prepared.
    """
    session_id = f"portal_{uuid.uuid4().hex[:12]}"

    # Separate filled vs missing
    filled: Dict[str, Any] = {k: v for k, v in form_fields.items() if v is not None and v is not False}
    missing: list = [k for k, v in form_fields.items() if v is None]

    portal_data = {
        "session_id": session_id,
        "user_id": user_id,
        "scheme_id": scheme_id,
        "review_url": f"https://mock-portal.iva.demo/review/{session_id}",
        "filled_fields": filled,
        "missing_fields": missing,
        "hard_stop_message": (
            "⚠️ FORM READY FOR REVIEW — NOT SUBMITTED.\n\n"
            "Iva has prepared your application form. We stop here intentionally.\n\n"
            "To complete your application:\n"
            "1. Review the form details below carefully.\n"
            "2. Visit the official portal at the scheme's official URL.\n"
            "3. Complete Aadhaar OTP / identity verification yourself.\n"
            "4. Submit the form.\n\n"
            "We respect your right to control your own identity verification."
        ),
        "portal_status": "ready_for_review",
        "timestamp": datetime.utcnow().isoformat(),
    }

    _portal_sessions[session_id] = portal_data
    logger.info(
        "Mock portal session created: session_id=%s, user_id=%s, scheme_id=%s, filled=%d fields",
        session_id, user_id, scheme_id, len(filled),
    )
    return portal_data


async def get_portal_session(session_id: str) -> Dict[str, Any] | None:
    """Retrieve a mock portal session for display."""
    return _portal_sessions.get(session_id)
