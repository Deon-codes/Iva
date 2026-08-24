"""
Status Agent (Person 4 / feature/status-documents)

Owns the async, background half of the platform: this is what makes the
system "keep working after the user leaves." Designed to be called by a
Cloud Scheduler -> Cloud Run job, but is a plain function so it's trivial
to unit test and run locally without any cloud plumbing.

Flow per application:
    1. Poll the mock government portal for current status.
    2. Compare against our last known status.
    3. If unchanged -> no-op (idempotent).
    4. If changed:
        a. Validate + apply the state transition.
        b. If rejected, ask Gemini to explain the reason in plain
           language (never inventing a reason not given to it) and
           propose a next action.
        c. Store a StatusEvent (event timeline / dedupe key).
        d. Create a user notification.
    5. Return the event (or None if nothing changed) so callers/tests
       can assert on it without hitting any store.

Gemini calls are isolated behind `_explain_rejection` so this module
runs fully offline (deterministic fallback) if no API key is configured
— useful for CI and for the rest of the team before Day 3.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from backend.models.application import (
    Application,
    ApplicationStatus,
    InvalidTransitionError,
    StatusEvent,
)
from backend.services import mock_government_portal, notifications

logger = logging.getLogger("status_agent")

# In-memory application + event stores for the hackathon.
# Swap for Firestore reads/writes without changing the function bodies below.
_APPLICATIONS: dict[str, Application] = {}
_EVENTS: dict[str, list[StatusEvent]] = {}

# Maps the mock portal's raw status strings to our internal enum.
_GOV_STATUS_MAP: dict[str, ApplicationStatus] = {
    "under_review": ApplicationStatus.UNDER_REVIEW,
    "action_required": ApplicationStatus.ACTION_REQUIRED,
    "approved": ApplicationStatus.APPROVED,
    "rejected": ApplicationStatus.REJECTED,
}

# Deterministic fallbacks for common rejection reasons — used if Gemini is
# unavailable, and as the "no invented reasons" ground truth for prompting.
_KNOWN_REJECTION_ACTIONS: dict[str, str] = {
    "income certificate expired": "Upload a renewed income certificate.",
    "document mismatch": "Confirm the name on your documents matches your application, then re-upload.",
    "missing document": "Upload the missing document listed in your application.",
}


def register_application(app: Application) -> None:
    """Test/demo helper — normally the application already exists in the store."""
    _APPLICATIONS[app.id] = app
    _EVENTS.setdefault(app.id, [])


def get_application(application_id: str) -> Optional[Application]:
    return _APPLICATIONS.get(application_id)


def get_events(application_id: str) -> list[StatusEvent]:
    return list(_EVENTS.get(application_id, []))


def check_application_status(application_id: str) -> Optional[StatusEvent]:
    """
    Entry point for the scheduled job. Safe to call repeatedly — a
    no-op if the government portal hasn't reported a change since the
    last check (idempotent, so retries/duplicate triggers are harmless).
    """
    application = _APPLICATIONS.get(application_id)
    if application is None:
        logger.warning("check_application_status: unknown application_id=%s", application_id)
        return None

    gov_response = mock_government_portal.get_application_status(application_id)
    new_status = _GOV_STATUS_MAP.get(gov_response["status"])
    if new_status is None:
        logger.warning(
            "check_application_status: unrecognized gov status '%s' for app=%s",
            gov_response["status"],
            application_id,
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

    if new_status == ApplicationStatus.REJECTED:
        application.rejection_reason = reason
        explanation, next_action = _explain_rejection(reason)
        application.next_action = next_action
    elif new_status == ApplicationStatus.ACTION_REQUIRED:
        next_action = reason or "Please review your application for required updates."
        application.next_action = next_action

    event = StatusEvent.new(
        application_id=application_id,
        previous_status=previous_status,
        new_status=new_status,
        gov_status_raw=gov_response["status"],
        reason=reason,
        explanation=explanation,
        next_action=next_action,
    )
    _EVENTS.setdefault(application_id, []).append(event)

    _notify_for_status_change(application, event)

    logger.info(
        "check_application_status: app=%s transitioned %s -> %s",
        application_id, previous_status.value, new_status.value,
    )
    return event


def _explain_rejection(reason: Optional[str]) -> tuple[str, str]:
    """
    Turn a raw rejection reason into a plain-language explanation + a
    concrete next action. Reason is always grounded in what the mock
    portal actually returned — Gemini is instructed to explain it, not
    invent one.
    """
    if not reason:
        return (
            "Your application was rejected but no specific reason was provided by the portal.",
            "Contact support or resubmit your application for review.",
        )

    known_action = _KNOWN_REJECTION_ACTIONS.get(reason.strip().lower())

    gemini_explanation = _call_gemini_for_explanation(reason)
    if gemini_explanation:
        return gemini_explanation, known_action or "Review and correct the issue, then resubmit."

    # Deterministic fallback if Gemini isn't configured (keeps this module
    # runnable offline for the rest of the team before Day 3).
    return (
        f"Your application was rejected. Reason given by the portal: {reason}.",
        known_action or "Review and correct the issue, then resubmit.",
    )


def _call_gemini_for_explanation(reason: str) -> Optional[str]:
    """
    Isolated Gemini call. Returns None (triggering the deterministic
    fallback above) if no API key is configured or the call fails, so
    the rest of the pipeline never hard-depends on Gemini being up.
    """
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY_HZ")
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
    except Exception:  # noqa: BLE001 — any SDK/network failure just falls back
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

    notifications.create_notification(
        application_id=application.id,
        user_id=application.user_id,
        message=message,
        kind="action_required" if event.new_status == ApplicationStatus.ACTION_REQUIRED else "status_change",
    )


if __name__ == "__main__":
    # Quick manual smoke test — run with: python -m backend.agents.status_agent
    logging.basicConfig(level=logging.INFO)

    app = Application(id="app_001", user_id="user_001", scheme_id="scheme_001",
                       status=ApplicationStatus.UNDER_REVIEW)
    register_application(app)

    print("No change yet:", check_application_status("app_001"))

    mock_government_portal.seed("app_001", "rejected", "Income certificate expired")
    event = check_application_status("app_001")
    print("After rejection:", event)
    print("Notifications:", notifications.list_notifications_for_user("user_001"))