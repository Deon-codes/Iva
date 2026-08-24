"""
Application state machine + shared data models for the async status
tracking flow (Person 4 / feature/status-documents).

Kept dependency-free (stdlib only) so it's trivial to unit test.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    READY_FOR_REVIEW = "ready_for_review"
    OTP_REQUIRED = "otp_required"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACTION_REQUIRED = "action_required"
    APPROVED = "approved"
    REJECTED = "rejected"


# Explicit allow-list of transitions. Anything not listed here is invalid.
VALID_TRANSITIONS: dict[ApplicationStatus, set[ApplicationStatus]] = {
    ApplicationStatus.DRAFT: {ApplicationStatus.READY_FOR_REVIEW},
    ApplicationStatus.READY_FOR_REVIEW: {ApplicationStatus.OTP_REQUIRED, ApplicationStatus.DRAFT},
    ApplicationStatus.OTP_REQUIRED: {ApplicationStatus.SUBMITTED, ApplicationStatus.READY_FOR_REVIEW},
    ApplicationStatus.SUBMITTED: {ApplicationStatus.UNDER_REVIEW},
    ApplicationStatus.UNDER_REVIEW: {
        ApplicationStatus.ACTION_REQUIRED,
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
    },
    ApplicationStatus.ACTION_REQUIRED: {ApplicationStatus.UNDER_REVIEW},
    ApplicationStatus.APPROVED: set(),
    ApplicationStatus.REJECTED: set(),
}


class InvalidTransitionError(Exception):
    def __init__(self, from_status: ApplicationStatus, to_status: ApplicationStatus):
        super().__init__(f"Invalid transition: {from_status.value} -> {to_status.value}")
        self.from_status = from_status
        self.to_status = to_status


def validate_transition(from_status: ApplicationStatus, to_status: ApplicationStatus) -> None:
    if to_status not in VALID_TRANSITIONS.get(from_status, set()):
        raise InvalidTransitionError(from_status, to_status)


@dataclass
class Application:
    id: str
    user_id: str
    scheme_id: str
    status: ApplicationStatus = ApplicationStatus.DRAFT
    submitted_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    next_action: Optional[str] = None

    def transition_to(self, new_status: ApplicationStatus) -> None:
        validate_transition(self.status, new_status)
        self.status = new_status
        if new_status == ApplicationStatus.SUBMITTED:
            self.submitted_at = datetime.now(timezone.utc).isoformat()


@dataclass
class StatusEvent:
    """An immutable record of a status change, used for the event timeline
    and to make status-change detection idempotent (dedupe on gov_status_raw)."""

    id: str
    application_id: str
    previous_status: Optional[ApplicationStatus]
    new_status: ApplicationStatus
    gov_status_raw: Optional[str]
    reason: Optional[str]
    explanation: Optional[str]
    next_action: Optional[str]
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @staticmethod
    def new(
        application_id: str,
        previous_status: Optional[ApplicationStatus],
        new_status: ApplicationStatus,
        gov_status_raw: Optional[str] = None,
        reason: Optional[str] = None,
        explanation: Optional[str] = None,
        next_action: Optional[str] = None,
    ) -> "StatusEvent":
        return StatusEvent(
            id=str(uuid.uuid4()),
            application_id=application_id,
            previous_status=previous_status,
            new_status=new_status,
            gov_status_raw=gov_status_raw,
            reason=reason,
            explanation=explanation,
            next_action=next_action,
        )