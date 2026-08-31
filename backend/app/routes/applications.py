"""POST/GET/PATCH /api/applications · POST /api/applications/{id}/prepare
POST /api/applications/{id}/status-check · GET /api/applications/{id}/events
POST /api/applications/{id}/mock-submit

Application lifecycle endpoints.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.application import Application, ApplicationCreate, ApplicationStatus
from app.services import firestore_service as fs

router = APIRouter(prefix="/api", tags=["applications"])
logger = logging.getLogger(__name__)

# ─── Mock government portal state (for demo simulation) ─────────────────────
_MOCK_GOV_DB: Dict[str, Dict[str, Any]] = {}


def _seed_mock_gov(application_id: str, status: str, reason: Optional[str] = None) -> None:
    """Seed mock government portal response for demo."""
    _MOCK_GOV_DB[application_id] = {"status": status, "reason": reason}


def _get_mock_gov_status(application_id: str) -> Dict[str, Any]:
    """Get mock government portal response."""
    return _MOCK_GOV_DB.get(application_id, {"status": "under_review", "reason": None})


@router.post(
    "/applications",
    response_model=Application,
    status_code=201,
    summary="Create a new scholarship application",
)
async def create_application(body: ApplicationCreate) -> Application:
    """
    Create a new application in DRAFT status.
    The agent will call this after preparing the form.

    Shared application object shape (used by Person 2 UI and Person 4 status agent):
    ```json
    {
      "id": "app_001",
      "userId": "user_001",
      "schemeId": "scheme_001",
      "status": "draft",
      "submittedAt": null,
      "rejectionReason": null,
      "nextAction": null
    }
    ```
    """
    app = await fs.create_application(body.user_id, body.scheme_id)
    return Application(**app)


@router.get(
    "/applications",
    response_model=List[Application],
    summary="List all applications for a user",
)
async def list_applications(
    user_id: str = Query(..., description="Filter applications by user ID"),
) -> List[Application]:
    """List all applications for a given user."""
    apps = await fs.list_applications_for_user(user_id)
    return [Application(**a) for a in apps]


@router.get(
    "/applications/{application_id}",
    response_model=Application,
    summary="Get a specific application",
)
async def get_application(
    application_id: str,
    user_id: Optional[str] = Query(None, description="Verify ownership"),
) -> Application:
    """
    Retrieve full details of a single application.
    If user_id is provided, verifies the application belongs to that user.
    """
    app = await fs.get_application(application_id)
    if app is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application '{application_id}' not found.",
        )
    if user_id and app.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return Application(**app)


# ─── PATCH /api/applications/{application_id} ────────────────────────────────


class ApplicationUpdate(BaseModel):
    """Fields that can be updated on an application."""
    status: Optional[ApplicationStatus] = None
    rejection_reason: Optional[str] = None
    next_action: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    submitted_at: Optional[str] = None


@router.patch(
    "/applications/{application_id}",
    response_model=Application,
    summary="Update an application",
)
async def patch_application(
    application_id: str,
    body: ApplicationUpdate,
    user_id: Optional[str] = Query(None, description="Verify ownership"),
) -> Application:
    """Update application status, form data, or next action."""
    # Verify ownership if user_id provided
    if user_id:
        existing = await fs.get_application(application_id)
        if existing is None:
            raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")
        if existing.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Access denied.")

    updated = await fs.update_application_status(
        application_id=application_id,
        status=body.status.value if body.status else None,
        rejection_reason=body.rejection_reason,
        next_action=body.next_action,
        form_data=body.form_data,
    )
    if updated is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application '{application_id}' not found.",
        )
    return Application(**updated)


# ─── POST /api/applications/{application_id}/prepare ────────────────────────


class PrepareResult(BaseModel):
    """The full preparation result returned to the frontend."""
    application_id: str
    scheme_id: str
    scheme_name: str
    status: str
    form_fields: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    required_documents: List[str] = Field(default_factory=list)
    completion_percentage: float = 0.0
    ready_to_submit: bool = False
    notes: str = ""


@router.post(
    "/applications/{application_id}/prepare",
    response_model=PrepareResult,
    summary="Prepare application: map profile + docs to form fields",
)
async def prepare_application(application_id: str) -> PrepareResult:
    """
    Trigger application preparation.
    Maps user profile and documents to the scheme's required form fields.
    Updates the application record with prepared data.
    """
    app = await fs.get_application(application_id)
    if app is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application '{application_id}' not found.",
        )

    user_id = app.get("userId", "")
    scheme_id = app.get("schemeId", "")
    # Note: ownership is inherent — we use the userId from the stored application,
    # not from the request, so there's no way to prepare another user's application.

    # Run the existing preparation logic from application tools
    from agents.tools.application_tools import prepare_form_fields
    result = await prepare_form_fields(user_id, scheme_id)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    # Calculate completion percentage
    total_fields = len(result["form_fields"])
    filled_fields = sum(1 for v in result["form_fields"].values() if v is not None and v is not False)
    field_pct = (filled_fields / total_fields * 100) if total_fields > 0 else 0

    total_docs = len(result["required_documents"])
    filled_docs = total_docs - len(result["missing_documents"])
    doc_pct = (filled_docs / total_docs * 100) if total_docs > 0 else 100

    completion = round((field_pct * 0.5 + doc_pct * 0.5), 1)

    # Determine status based on readiness
    if result["ready_to_submit"]:
        new_status = "ready_for_review"
        next_action = "Review and submit application"
    elif result["missing_fields"]:
        new_status = "action_required"
        next_action = f"Provide missing information: {', '.join(result['missing_fields'][:3])}"
    elif result["missing_documents"]:
        new_status = "action_required"
        next_action = f"Upload required documents: {', '.join(result['missing_documents'][:3])}"
    else:
        new_status = "draft"
        next_action = "Form prepared — ready for review"

    # Persist prepared data to the application
    prepared_form_data = {
        "fields": result["form_fields"],
        "missing_fields": result["missing_fields"],
        "missing_documents": result["missing_documents"],
        "required_documents": result["required_documents"],
        "completion_percentage": completion,
        "ready_to_submit": result["ready_to_submit"],
        "notes": result["notes"],
        "prepared_at": __import__("datetime").datetime.utcnow().isoformat(),
    }

    await fs.update_application_status(
        application_id=application_id,
        status=new_status,
        next_action=next_action,
        form_data=prepared_form_data,
    )

    # Log event
    await fs.append_application_event(
        application_id=application_id,
        event_type="preparation",
        message=f"Application prepared: {completion}% complete. {result['notes']}",
        triggered_by="system",
        new_status=new_status,
    )

    return PrepareResult(
        application_id=application_id,
        scheme_id=scheme_id,
        scheme_name=result["scheme_name"],
        status=new_status,
        form_fields=result["form_fields"],
        missing_fields=result["missing_fields"],
        missing_documents=result["missing_documents"],
        required_documents=result["required_documents"],
        completion_percentage=completion,
        ready_to_submit=result["ready_to_submit"],
        notes=result["notes"],
    )


# ─── POST /api/applications/{id}/mock-submit ────────────────────────────────


class MockSubmitRequest(BaseModel):
    """Simulate government portal submission."""
    scheme_id: Optional[str] = None


class MockSubmitResponse(BaseModel):
    """Result of simulated submission."""
    application_id: str
    mock_status: str
    message: str
    verification_context: Dict[str, Any] = Field(default_factory=dict)
    event: Optional[Dict[str, Any]] = None


@router.post(
    "/applications/{application_id}/mock-submit",
    response_model=MockSubmitResponse,
    summary="Simulate government portal submission (demo)",
)
async def mock_submit_application(
    application_id: str,
    body: MockSubmitRequest = MockSubmitRequest(),
) -> MockSubmitResponse:
    """
    Simulate submitting an application to a government portal.
    This is a DEMO feature — no real government system is contacted.
    """
    app_data = await fs.get_application(application_id)
    if app_data is None:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")

    # Update status to submitted
    await fs.update_application_status(
        application_id=application_id,
        status="submitted",
        submitted_at=datetime.now(),
    )

    # Seed mock government portal as under_review
    _seed_mock_gov(application_id, "under_review")

    # Log event
    event = await fs.append_application_event(
        application_id=application_id,
        event_type="mock_submission",
        message="Application submitted to simulated government portal (🔴 DEMO).",
        triggered_by="user",
        new_status="submitted",
    )

    verification_context = {
        "government_portal_submission": {
            "type": "🔴 MOCK",
            "source": "Simulated government portal (demo only)",
            "description": "In production, this would submit to actual government APIs (API Setu, DigiLocker, etc.)",
        },
        "otp_verification": {
            "type": "🟡 HANDOFF",
            "description": "User manually completes OTP/CAPTCHA on the real government portal",
        },
    }

    return MockSubmitResponse(
        application_id=application_id,
        mock_status="under_review",
        message="Application submitted to simulated government portal. Status: under_review.",
        verification_context=verification_context,
        event=event,
    )


# ─── POST /api/applications/{id}/status-check ──────────────────────────────


class StatusCheckResponse(BaseModel):
    """Result of a status check against the mock government portal."""
    application_id: str
    previous_status: str
    new_status: str
    status_changed: bool
    event: Optional[Dict[str, Any]] = None
    verification_context: Dict[str, Any] = Field(default_factory=dict)


@router.post(
    "/applications/{application_id}/status-check",
    response_model=StatusCheckResponse,
    summary="Check application status (mock government portal)",
)
async def check_status(application_id: str) -> StatusCheckResponse:
    """
    Check the application's status against the mock government portal.
    Simulates what a Cloud Scheduler/Pub/Sub job would do in production.
    """
    app_data = await fs.get_application(application_id)
    if app_data is None:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")

    previous_status = app_data.get("status", "draft")
    gov_response = _get_mock_gov_status(application_id)
    gov_status = gov_response.get("status", "under_review")
    gov_reason = gov_response.get("reason")

    # Map gov status to app status
    status_map = {
        "under_review": "under_review",
        "action_required": "action_required",
        "approved": "approved",
        "rejected": "rejected",
    }
    new_status = status_map.get(gov_status, previous_status)
    status_changed = new_status != previous_status

    event = None
    if status_changed:
        rejection_reason = None
        next_action = None
        if new_status == "rejected":
            rejection_reason = gov_reason or "Application rejected by portal"
            next_action = "Review rejection reason and resubmit"
        elif new_status == "action_required":
            next_action = gov_reason or "Please update your application"

        await fs.update_application_status(
            application_id=application_id,
            status=new_status,
            rejection_reason=rejection_reason,
            next_action=next_action,
        )

        event = await fs.append_application_event(
            application_id=application_id,
            event_type="status_change",
            message=f"Status changed: {previous_status} → {new_status}",
            triggered_by="status_check",
            new_status=new_status,
            previous_status=previous_status,
            gov_status_raw=gov_status,
            rejection_reason=rejection_reason,
        )

    verification_context = {
        "government_check": {
            "type": "🔴 MOCK",
            "source": "Mock government portal (demo only)",
            "description": "In production, this would poll actual government APIs",
        },
        "status_poll": {
            "type": "REAL",
            "description": "Background job polls for status changes",
        },
    }

    return StatusCheckResponse(
        application_id=application_id,
        previous_status=previous_status,
        new_status=new_status,
        status_changed=status_changed,
        event=event,
        verification_context=verification_context,
    )


# ─── GET /api/applications/{id}/events ──────────────────────────────────────


class ApplicationEventResponse(BaseModel):
    """A single application status event."""
    event_id: str
    application_id: str
    event_type: str
    message: str
    triggered_by: str
    timestamp: str
    new_status: Optional[str] = None
    previous_status: Optional[str] = None
    gov_status_raw: Optional[str] = None
    rejection_reason: Optional[str] = None


@router.get(
    "/applications/{application_id}/events",
    response_model=List[ApplicationEventResponse],
    summary="Get application event timeline",
)
async def get_application_events(
    application_id: str,
) -> List[ApplicationEventResponse]:
    """
    Return the full event timeline for an application.
    Shows preparation, submission, status changes, etc.
    """
    app_data = await fs.get_application(application_id)
    if app_data is None:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")

    # Query events from Firestore/in-memory store
    client = fs._get_client()
    if client is None:
        # In-memory: filter by application_id prefix
        all_events = fs.get_stub()._data.get("application_events", {})
        events = [
            v for v in all_events.values()
            if v.get("application_id") == application_id
        ]
        events.sort(key=lambda e: e.get("timestamp", ""))
    else:
        # Firestore query
        query = (
            client.collection("applications")
            .document(application_id)
            .collection("events")
            .order_by("timestamp")
        )
        events = [snap.to_dict() async for snap in query.stream()]

    return [ApplicationEventResponse(**e) for e in events]


# ─── POST /api/mock-government/applications/{id}/seed ───────────────────────


class SeedGovStatusRequest(BaseModel):
    """Seed mock government portal status for testing."""
    status: str
    reason: Optional[str] = None


@router.post(
    "/mock-government/applications/{application_id}/seed",
    status_code=204,
    summary="Seed mock government portal status (demo/testing)",
)
async def seed_mock_gov_status(
    application_id: str,
    body: SeedGovStatusRequest,
) -> None:
    """
    Seed the mock government portal with a specific status for testing.
    Used during demo to simulate rejection, approval, etc.
    """
    _seed_mock_gov(application_id, body.status, body.reason)


@router.get(
    "/mock-government/applications/{application_id}",
    summary="Get mock government portal status",
)
async def get_mock_gov_status(application_id: str) -> Dict[str, Any]:
    """Read the current mock government portal status for an application."""
    return _get_mock_gov_status(application_id)
