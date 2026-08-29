"""
Status checking + mock government portal + notifications.
Application CRUD lives in applic.py (see that file's docstring for why
it moved).
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents import status_agent
from models.application import ApplicationStatus, CorrectionDraft, StatusEvent
from services import mock_govt, notif

router = APIRouter()


class SeedGovStatusRequest(BaseModel):
    status: str
    reason: Optional[str] = None


class CorrectionDraftResponse(BaseModel):
    application_id: str
    fixable: bool
    instructions: str
    document_to_reupload: Optional[str]
    fields_to_update: dict[str, str]


class StatusEventResponse(BaseModel):
    id: str
    application_id: str
    previous_status: Optional[ApplicationStatus]
    new_status: ApplicationStatus
    gov_status_raw: Optional[str]
    reason: Optional[str]
    explanation: Optional[str]
    next_action: Optional[str]
    correction_draft: Optional[CorrectionDraftResponse]
    created_at: str


class NotificationResponse(BaseModel):
    id: str
    application_id: str
    user_id: str
    message: str
    kind: str
    created_at: str


@router.post("/api/status/check/{application_id}", response_model=Optional[StatusEventResponse])
def trigger_status_check(application_id: str):
    """Manually fire the background status checker (what Cloud Scheduler
    will call on a timer). Returns null if nothing changed."""
    if status_agent.get_application(application_id) is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return status_agent.check_application_status(application_id)


@router.get("/mock-government/applications/{application_id}")
def get_mock_gov_status(application_id: str):
    return mock_govt.get_application_status(application_id)


@router.post("/mock-government/applications/{application_id}/seed", status_code=204)
def seed_mock_gov_status(application_id: str, payload: SeedGovStatusRequest):
    mock_govt.seed(application_id, payload.status, payload.reason)


@router.get("/api/notifications/{user_id}", response_model=list[NotificationResponse])
def get_notifications(user_id: str):
    return notif.list_notifications_for_user(user_id)