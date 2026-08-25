"""
Status Agent (Person 4 / feature/status-documents)

Owns the async, background half of the platform. Designed to be called
by a Cloud Scheduler -> Cloud Run job, but is a plain function so it's
trivial to unit test and run locally without any cloud plumbing.

Flow per application:
    1. Poll the mock government portal for current status.
    2. Compare against our last known status.
    3. If unchanged -> no-op (idempotent).
    4. If changed:
        a. Validate + apply the state transition.
        b. If rejected or action_required, ask Gemini to explain the
           reason in plain language (never inventing a reason not
           given to it), propose a next action, and build a concrete
           correction draft when the issue is fixable.
        c. Store a StatusEvent (event timeline / dedupe key).
        d. Create a user notification.
    5. Return the event (or None if nothing changed).

Gemini calls are isolated behind `_explain_rejection` so this module
runs fully offline (deterministic fallback) if no API key is configured.
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

logger = logging.getLogger("status_agent")

_APPLICATIONS: dict[str, Application] = {}
_EVENTS: dict[str, list[StatusEvent]] = {}

_GOV_STATUS_MAP: dict[str, ApplicationStatus] = {
    "under_review": ApplicationStatus.UNDER_REVIEW,
    "action_required": ApplicationStatus.ACTION_REQUIRED,
    "approved": ApplicationStatus.APPROVED,
    "rejected": ApplicationStatus.REJECTED,
}

# Ground truth for known, fixable rejection/action reasons: the plain
# instruction AND (where relevant) which document needs re-uploading.
# This drives both the deterministic fallback explanation and the
# correction draft — Gemini never invents beyond this.
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


def register_application(app: Application) -> None:
    _APPLICATIONS[app.id] = app
    _EVENTS.setdefault(app.id, [])


def get_application(application_id: str) -> Optional[Application]:
    return _APPLICATIONS.get(application_id)


def get_events(application_id: str) -> list[StatusEvent]:
    return list(_EVENTS.get(application_id, []))


def check_application_status(application_id: str) -> Optional[StatusEvent]:
    """Entry point for the scheduled job. Safe to call repeatedly — a
    no-op if the government portal hasn't reported a change."""
    application = _APPLICATIONS.get(application_id)
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

    event = StatusEvent.new(
        application_id=application_id,
        previous_status=previous_status,
        new_status=new_status,
        gov_status_raw=gov_response["status"],
        reason=reason,
        explanation=explanation,
        next_action=next_action,
        correction_draft=correction_draft,
    )
    _EVENTS.setdefault(application_id, []).append(event)

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
    """Plain-language explanation + next action. Reason is always
    grounded in what the mock portal actually returned."""
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
    """
    Turns a known, fixable issue into something the user can actually
    act on — not just a sentence, but which document to re-upload (if
    any). Only built for reasons we recognize; unknown reasons get
    fixable=False so the frontend can route to manual support instead
    of pretending there's a one-click fix.
    """
    if not reason:
        return None

    entry = _KNOWN_ISSUES.get(reason.strip().lower())
    if entry is None:
        return CorrectionDraft(
            application_id=application_id,
            fixable=False,
            instructions="This issue isn't automatically resolvable. Please contact support.",
        )

    return CorrectionDraft(
        application_id=application_id,
        fixable=True,
        instructions=entry["instructions"],
        document_to_reupload=entry["document_to_reupload"],
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
        application_id=application.id,
        user_id=application.user_id,
        message=message,
        kind="action_required" if event.new_status == ApplicationStatus.ACTION_REQUIRED else "status_change",
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    app = Application(id="app_001", user_id="user_001", scheme_id="scheme_001",
                       status=ApplicationStatus.UNDER_REVIEW)
    register_application(app)

    print("No change yet:", check_application_status("app_001"))

    mock_govt.seed("app_001", "rejected", "Income certificate expired")
    event = check_application_status("app_001")
    print("After rejection:", event)
    print("Notifications:", notif.list_notifications_for_user("user_001"))