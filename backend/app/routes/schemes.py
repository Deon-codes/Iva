"""GET /api/schemes · GET /api/schemes/{id} — scheme discovery endpoints."""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException

from app.services.scheme_data import get_all_schemes, get_scheme_by_id

router = APIRouter(prefix="/api", tags=["schemes"])
logger = logging.getLogger(__name__)


@router.get("/schemes", summary="List all available government schemes")
async def list_schemes() -> List[dict]:
    """
    Return the list of all verified government schemes in the Hazela database.
    Currently supports 3 MVP schemes:
    - PM Scholarship Scheme (CAPF/RPF)
    - Maharashtra Rajarshi Shahu Maharaj Scholarship
    - AICTE Pragati Scholarship for Girls
    """
    schemes = get_all_schemes()
    # Return lightweight projection for list view
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "department": s["department"],
            "category": s.get("category"),
            "is_central": s["is_central"],
            "state": s.get("state"),
            "benefits_summary": s["benefits"][:120] + "..." if len(s["benefits"]) > 120 else s["benefits"],
            "official_url": s["official_url"],
            "eligibility_summary": s["eligibility"]["description"][:150] + "...",
        }
        for s in schemes
    ]


@router.get("/schemes/{scheme_id}", summary="Get full details of a specific scheme")
async def get_scheme(scheme_id: str) -> dict:
    """Retrieve the full scheme details including all eligibility criteria and required documents."""
    scheme = get_scheme_by_id(scheme_id)
    if scheme is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scheme '{scheme_id}' not found. Use GET /api/schemes to list available schemes.",
        )
    return scheme
