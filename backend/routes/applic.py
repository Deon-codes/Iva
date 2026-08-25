"""
Application routes — create/read applications and their event timeline.
Split out from status_route.py so applic.py (which was an empty stub)
actually holds what its name promises.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents import status_agent
from models.application import Application, ApplicationStatus, CorrectionDraft, StatusEvent

router = APIRouter()


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
            id=app.id, user_id=app.user_id, scheme_id=app.scheme_id, status=app.status,
            submitted_at=app.submitted_at, rejection_reason=app.rejection_reason,
            next_action=app.next_action,
        )


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


@router.post("/api/applications", response_model=ApplicationResponse, status_code=201)
def create_application(payload: CreateApplicationRequest):
    if status_agent.get_application(payload.id) is not None:
        raise HTTPException(status_code=409, detail="Application already exists")

    app = Application(id=payload.id, user_id=payload.user_id,
                       scheme_id=payload.scheme_id, status=payload.status)
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