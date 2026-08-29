"""
POST /api/internal/status/trigger
The exact handoff point between Person 1 (agent-core) and Person 4 (status-documents).

Person 4's Cloud Scheduler / Pub/Sub subscriber calls this endpoint to trigger
a status check for an application. Person 1 owns this endpoint and the
check_application_status() function. Person 4 owns the scheduling logic.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.tools.status_tools import check_application_status

router = APIRouter(prefix="/api/internal", tags=["internal"])
logger = logging.getLogger(__name__)


class StatusTriggerRequest(BaseModel):
    application_id: str


@router.post(
    "/status/trigger",
    summary="Trigger an async application status check (Person 4 integration)",
)
async def trigger_status_check(body: StatusTriggerRequest) -> dict:
    """
    Trigger a status check for a specific application.
    Called by Person 4's Cloud Scheduler or Pub/Sub subscriber.

    Returns current application status + whether a Pub/Sub message was published
    for Person 4's deeper status-parsing agent.
    """
    try:
        result = await check_application_status(body.application_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Status trigger error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
