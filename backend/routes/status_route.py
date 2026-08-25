"""
FastAPI routes for Person 4's slice: applications, status checking,
the mock government portal, and notifications.

These exist so you can exercise the whole background-status flow over
HTTP (Swagger UI, curl, or Person 2's frontend) without needing Cloud
Scheduler wired up yet. In production, Cloud Scheduler hits
POST /api/status/check/{id} on a timer -- here you trigger it manually
to prove the pipeline works.

Mount with: app.include_router(status_router)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents import status_agent
from models.application import Application, ApplicationStatus
from services import mock_govt, notif

router = APIRouter()


# ---------------------------------------------------------------------------
# Request/response schemas
# ---------------------------------------------------------------------------

class CreateApplicationRequest(BaseModel):
    id: str
    user_id: str
    scheme_id: str
    status: ApplicationStatus = ApplicationStatus.UNDER_REVIEW


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    scheme_id: str
    status: ApplicationStatus
    submitted_at: Optional[str]
    rejection_reason: Optional[str]
    next_action: Optional[str]

    @staticmethod
    def from_application(app: Application) -> "ApplicationResponse":
        return ApplicationResponse(
            id=app.id,
            user_id=app.user_id,
            scheme_id=app.scheme_id,
            status=app.status,
            submitted_at=app.submitted_at,
            rejection_reason=app.rejection_reason,
            next_action=app.next_action,
        )


class SeedGovStatusRequest(BaseModel):
    status: str  # "under_review" | "action_required" | "approved" | "rejected"
    reason: Optional[str] = None


class StatusEventResponse(BaseModel):
    id: str
    application_id: str
    previous_status: Optional[ApplicationStatus]
    new_status: ApplicationStatus
    gov_status_raw: Optional[str]
    reason: Optional[str]
    explanation: Optional[str]
    next_action: Optional[str]
    created_at: str


class NotificationResponse(BaseModel):
    id: str
    application_id: str
    user_id: str
    message: str
    kind: str
    created_at: str


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------

@router.post("/api/applications", response_model=ApplicationResponse, status_code=201)
def create_application(payload: CreateApplicationRequest):
    """Test helper: register an application in the in-memory store so
    check_application_status has something to operate on."""
    if status_agent.get_application(payload.id) is not None:
        raise HTTPException(status_code=409, detail="Application already exists")

    app = Application(
        id=payload.id,
        user_id=payload.user_id,
        scheme_id=payload.scheme_id,
        status=payload.status,
    )
    status_agent.register_application(app)
    return ApplicationResponse.from_application(app)


@router.get("/api/applications/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: str):
    app = status_agent.get_application(application_id)
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse.from_application(app)


@router.get("/api/applications/{application_id}/events", response_model=list[StatusEventResponse])
def get_application_events(application_id: str):
    if status_agent.get_application(application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return status_agent.get_events(application_id)


# ---------------------------------------------------------------------------
# Status checking (what Cloud Scheduler will call on a timer)
# ---------------------------------------------------------------------------

@router.post(
    "/api/status/check/{application_id}",
    response_model=Optional[StatusEventResponse],
)
def trigger_status_check(application_id: str):
    """
    Manually fire the background status checker. Returns the new
    StatusEvent if something changed, or null if the portal hasn't
    reported a change (call it twice in a row to see the no-op).
    """
    if status_agent.get_application(application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")

    event = status_agent.check_application_status(application_id)
    return event


# ---------------------------------------------------------------------------
# Mock government portal
# ---------------------------------------------------------------------------

@router.get("/mock-government/applications/{application_id}")
def get_mock_gov_status(application_id: str):
    return mock_govt.get_application_status(application_id)


@router.post("/mock-government/applications/{application_id}/seed", status_code=204)
def seed_mock_gov_status(application_id: str, payload: SeedGovStatusRequest):
    """
    Test-only endpoint: simulate the government portal reporting a new
    status. Call this, then POST /api/status/check/{id} to see the
    agent detect and react to it -- this is your demo's "Scene 8/9".
    """
    mock_govt.seed(application_id, payload.status, payload.reason)


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@router.get("/api/notifications/{user_id}", response_model=list[NotificationResponse])
def get_notifications(user_id: str):
    return notif.list_notifications_for_user(user_id)