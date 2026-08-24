"""
Status tools — the handoff point between Person 1 (agent-core) and Person 4 (status-documents).

Person 1 exposes: check_application_status(application_id)
Person 4 owns:    the scheduler / Pub/Sub wiring that calls this trigger.

The trigger also publishes a Pub/Sub message so Person 4's async status-agent
can run its deeper portal-scraping / status-parsing logic.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from app.services import firestore_service as fs
from app.services.pubsub_service import publish_status_check_trigger

logger = logging.getLogger(__name__)


async def check_application_status(application_id: str) -> Dict[str, Any]:
    """
    Check and return the current status of an application.
    Also publishes a Pub/Sub trigger for Person 4's async status agent.

    This is the exact handoff point defined in AGENTS.md:
    Person 4 subscribes to the Pub/Sub topic to run deeper status checks.

    Args:
        application_id: The unique application identifier.

    Returns:
        Dict with:
            - application_id (str)
            - status (str) — current status value
            - nextAction (str | None) — what the user should do next
            - rejectionReason (str | None)
            - pubsub_triggered (bool) — whether the async check was also triggered
    """
    application = await fs.get_application(application_id)
    if application is None:
        return {
            "application_id": application_id,
            "error": "Application not found.",
            "pubsub_triggered": False,
        }

    # Publish async trigger for Person 4's status agent
    pubsub_triggered = await publish_status_check_trigger(application_id)

    return {
        "application_id": application_id,
        "status": application.get("status"),
        "nextAction": application.get("nextAction"),
        "rejectionReason": application.get("rejectionReason"),
        "submittedAt": application.get("submittedAt"),
        "pubsub_triggered": pubsub_triggered,
    }
