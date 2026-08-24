"""
Pydantic models for Application data.

The shared application object shape (agreed with Person 2 & Person 4):
{
  "id": "app_001",
  "userId": "user_001",
  "schemeId": "scheme_001",
  "status": "action_required",
  "submittedAt": null,
  "rejectionReason": null,
  "nextAction": "Upload income certificate"
}
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ApplicationStatus(str, Enum):
    """State machine values — see docs/architecture.md for the diagram."""

    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACTION_REQUIRED = "action_required"
    APPROVED = "approved"
    REJECTED = "rejected"


class ApplicationEvent(BaseModel):
    """Single entry in the events sub-collection (applications/{id}/events/{eventId})."""

    event_id: str
    event_type: str           # e.g. "status_change", "agent_note"
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    message: str
    triggered_by: str         # "agent" | user_id
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Application(BaseModel):
    """
    Firestore applications/{applicationId} document.
    Camelcase keys match the shared contract Person 2 and Person 4 depend on.
    """

    id: str
    userId: str
    schemeId: str
    status: ApplicationStatus = ApplicationStatus.DRAFT
    submittedAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None
    nextAction: Optional[str] = None
    # Internal fields (not in the minimal shared shape but stored in Firestore)
    form_data: Dict[str, Any] = Field(default_factory=dict)
    documents: List[str] = Field(default_factory=list)   # document IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ApplicationCreate(BaseModel):
    """Request body for POST /api/applications."""

    user_id: str
    scheme_id: str


class ApplicationStatusUpdate(BaseModel):
    """Internal — used by agents to update status."""

    status: ApplicationStatus
    rejection_reason: Optional[str] = None
    next_action: Optional[str] = None
    event_message: str = ""
