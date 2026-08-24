"""
Mock government portal.

Simulates the external system the status agent polls. Backed by an
in-memory dict for the hackathon — swap for Firestore-backed fixtures
later if needed, but do NOT point this at a real government site.
"""

from __future__ import annotations

from typing import Optional, TypedDict


class GovStatusResponse(TypedDict):
    status: str  # e.g. "under_review" | "approved" | "rejected"
    reason: Optional[str]


_MOCK_DB: dict[str, GovStatusResponse] = {}


def seed(application_id: str, status: str, reason: Optional[str] = None) -> None:
    """Test/demo helper to set or change what the mock portal reports."""
    _MOCK_DB[application_id] = {"status": status, "reason": reason}


def get_application_status(application_id: str) -> GovStatusResponse:
    """Equivalent of GET /mock-government/applications/{id}."""
    if application_id not in _MOCK_DB:
        return {"status": "under_review", "reason": None}
    return _MOCK_DB[application_id]