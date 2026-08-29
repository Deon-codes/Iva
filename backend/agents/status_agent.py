"""
Status Agent (Person 4 / feature/status-documents)

Owns the async, background half of the platform. Application/event
storage routes through Firestore (collections "applications" and
"status_events") when USE_FIRESTORE=true, otherwise in-memory — the
reasoning logic below is unchanged either way.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from models.application import (
    Application,
    ApplicationStatus,
    CorrectionDraft,
    InvalidTransitionError,
    StatusEvent,
)
from services import mock_govt, notif
from services.firestore_client import firestore_enabled, get_client

logger = logging.getLogger("status_agent")

_APPLICATIONS: dict[str, Application] = {}
_EVENTS: dict[str, list[StatusEvent]] = {}

_APPLICATIONS_COLLECTION = "applications"
_EVENTS_COLLECTION = "status_events"

_GOV_STATUS_MAP: dict[str, ApplicationStatus] = {
    "under_review": ApplicationStatus.UNDER_REVIEW,
    "action_required": ApplicationStatus.ACTION_REQUIRED,
    "approved": ApplicationStatus.APPROVED,
    "rejected": ApplicationStatus.REJECTED,
}

_KNOWN_ISSUES: dict[str, dict[str, Optional[str]]] = {
    "income certificate expired": {
        "instructions": "Upload a renewed income certificate.",
        "document_to_reupload": "income_certificate",
    },
    "document mismatch": {
        "instructions": "Confirm the name on your documents matches your application, then re-upload.",
        "document_to_reupload": None,
    },
    "missing document": {
        "instructions": "Upload the missing document listed in your application.",
        "document_to_reupload": None,
    },
    "missing caste certificate": {
        "instructions": "Upload your caste certificate.",
        "document_to_reupload": "caste_certificate",
    },
}


# --- storage helpers ---------------------------------------------------

def _app_to_dict(app: Application) -> dict:
    return {
        "id": app.id, "user_id": app.user_id, "scheme_id": app.scheme_id,
        "status": app.status.value, "submitted_at": app.submitted_at,
        "rejection_reason": app.rejection_reason, "next_action": app.next_action,
    }


def _app_from_dict(data: dict) -> Application:
    return Application(
        id=data["id"], user_id=data["user_id"], scheme_id=data["scheme_id"],
        status=ApplicationStatus(data["status"]), submitted_at=data.get("submitted_at"),
        rejection_reason=data.get("rejection_reason"), next_action=data.get("next_action"),
    )


def _draft_to_dict(draft: Optional[CorrectionDraft]) -> Optional[dict]:
    if draft is None:
        return None
    return {
        "application_id": draft.application_id, "fixable": draft.fixable,
        "instructions": draft.instructions, "document_to_reupload": draft.document_to_reupload,
        "fields_to_update": draft.fields_to_update,
    }


def _event_to_dict(event: StatusEvent) -> dict:
    return {
        "id": event.id, "application_id": event.application_id,
        "previous_status": event.previous_status.value if event.previous_status else None,
        "new_status": event.new_status.value, "gov_status_raw": event.gov_status_raw,
        "reason": event.reason, "explanation": event.explanation,
        "next_action": event.next_action, "correction_draft": _draft_to_dict(event.correction_draft),
        "created_at": event.created_at,
    }


def _save_application(app: Application) -> None:
    if firestore_enabled():
        get_client().collection(_APPLICATIONS_COLLECTION).document(app.id).set(_app_to_dict(app))
    else:
        _APPLICATIONS[app.id] = app


def _save_event(event: StatusEvent) -> None:
    if firestore_enabled():
        get_client().collection(_EVENTS_COLLECTION).document(event.id).set(_event_to_dict(event))
    else:
        _EVENTS.setdefault(event.application_id, []).append(event)


# --- public API ----------------------------------------------------------

def register_application(app: Application) -> None:
    _save_application(app)
    if not firestore_enabled():
        _EVENTS.setdefault(app.id, [])


def get_application(application_id: str) -> Optional[Application]:
    if firestore_enabled():
        snap = get_client().collection(_APPLICATIONS_COLLECTION).document(application_id).get()
        return _app_from_dict(snap.to_dict()) if snap.exists else None
    return _APPLICATIONS.get(application_id)


def get_events(application_id: str) -> list[StatusEvent]:
    if firestore_enabled():
        query = (
            get_client().collection(_EVENTS_COLLECTION)
            .where("application_id", "==", application_id)
            .order_by("created_at")
        )
        # Firestore returns dicts already matching StatusEvent's field
        # names except correction_draft/previous_status need reconstruction,
        # but the routes' response models re-validate on the way out, so
        # returning the raw dicts is fine for that layer.
        return [snap.to_dict() for snap in query.stream()]
    return list(_EVENTS.get(application_id, []))


def check_application_status(application_id: str) -> Optional[StatusEvent]:
    application = get_application(application_id)
    if application is None:
        logger.warning("check_application_status: unknown application_id=%s", application_id)
        return None

    gov_response = mock_govt.get_application_status(application_id)
    new_status = _GOV_STATUS_MAP.get(gov_response["status"])
    if new_status is None:
        logger.warning(
            "check_application_status: unrecognized gov status '%s' for app=%s",
            gov_response["status"], application_id,
        )
        return None

    previous_status = application.status
    if new_status == previous_status:
        logger.info("check_application_status: no change for app=%s (status=%s)",
                     application_id, previous_status.value)
        return None

    try:
        application.transition_to(new_status)
    except InvalidTransitionError:
        logger.error(
            "check_application_status: rejected invalid transition %s -> %s for app=%s",
            previous_status.value, new_status.value, application_id,
        )
        return None

    reason = gov_response.get("reason")
    explanation: Optional[str] = None
    next_action: Optional[str] = None
    correction_draft: Optional[CorrectionDraft] = None

    if new_status == ApplicationStatus.REJECTED:
        application.rejection_reason = reason
        explanation, next_action = _explain_rejection(reason)
        application.next_action = next_action
        correction_draft = _build_correction_draft(application_id, reason)
    elif new_status == ApplicationStatus.ACTION_REQUIRED:
        next_action = _lookup_instructions(reason) or reason or "Please review your application for required updates."
        application.next_action = next_action
        correction_draft = _build_correction_draft(application_id, reason)

    _save_application(application)

    event = StatusEvent.new(
        application_id=application_id, previous_status=previous_status, new_status=new_status,
        gov_status_raw=gov_response["status"], reason=reason, explanation=explanation,
        next_action=next_action, correction_draft=correction_draft,
    )
    _save_event(event)

    _notify_for_status_change(application, event)

    logger.info(
        "check_application_status: app=%s transitioned %s -> %s",
        application_id, previous_status.value, new_status.value,
    )
    return event


def _lookup_instructions(reason: Optional[str]) -> Optional[str]:
    if not reason:
        return None
    entry = _KNOWN_ISSUES.get(reason.strip().lower())
    return entry["instructions"] if entry else None


def _explain_rejection(reason: Optional[str]) -> tuple[str, str]:
    if not reason:
        return (
            "Your application was rejected but no specific reason was provided by the portal.",
            "Contact support or resubmit your application for review.",
        )

    known_instructions = _lookup_instructions(reason)
    gemini_explanation = _call_gemini_for_explanation(reason)
    if gemini_explanation:
        return gemini_explanation, known_instructions or "Review and correct the issue, then resubmit."

    return (
        f"Your application was rejected. Reason given by the portal: {reason}.",
        known_instructions or "Review and correct the issue, then resubmit.",
    )


def _build_correction_draft(application_id: str, reason: Optional[str]) -> Optional[CorrectionDraft]:
    if not reason:
        return None

    entry = _KNOWN_ISSUES.get(reason.strip().lower())
    if entry is None:
        return CorrectionDraft(
            application_id=application_id, fixable=False,
            instructions="This issue isn't automatically resolvable. Please contact support.",
        )

    return CorrectionDraft(
        application_id=application_id, fixable=True,
        instructions=entry["instructions"], document_to_reupload=entry["document_to_reupload"],
    )


def _call_gemini_for_explanation(reason: str) -> Optional[str]:
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "A government scheme application was rejected. "
            "Explain this rejection reason in one plain, empathetic sentence "
            "for a non-technical applicant. "
            "Do NOT invent details beyond what is given. "
            f"Rejection reason: \"{reason}\""
        )
        response = model.generate_content(prompt)
        text = (response.text or "").strip()
        return text or None
    except Exception:  # noqa: BLE001
        logger.exception("Gemini explanation call failed; using deterministic fallback")
        return None


def _notify_for_status_change(application: Application, event: StatusEvent) -> None:
    if event.new_status == ApplicationStatus.REJECTED:
        message = event.explanation or "Your application was rejected."
    elif event.new_status == ApplicationStatus.ACTION_REQUIRED:
        message = event.next_action or "Your application needs attention."
    elif event.new_status == ApplicationStatus.APPROVED:
        message = "Your application was approved."
    else:
        message = f"Your application status changed to {event.new_status.value}."

    notif.create_notification(
        application_id=application.id, user_id=application.user_id, message=message,
        kind="action_required" if event.new_status == ApplicationStatus.ACTION_REQUIRED else "status_change",
    )