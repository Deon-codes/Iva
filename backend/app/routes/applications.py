"""
POST /api/applications · GET /api/applications · GET /api/applications/{id}
Application lifecycle endpoints.
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.models.application import Application, ApplicationCreate
from app.services import firestore_service as fs

router = APIRouter(prefix="/api", tags=["applications"])
logger = logging.getLogger(__name__)


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
async def get_application(application_id: str) -> Application:
    """
    Retrieve full details of a single application.
    Returns the shared contract shape that Person 2's UI and Person 4's status agent depend on.
    """
    app = await fs.get_application(application_id)
    if app is None:
        raise HTTPException(
            status_code=404,
            detail=f"Application '{application_id}' not found.",
        )
    return Application(**app)
