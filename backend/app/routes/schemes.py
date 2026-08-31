"""GET /api/schemes · GET /api/schemes/{id} — scheme discovery endpoints."""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.services import scheme_ingestion as ingestion
from app.services import firestore_service as fs

router = APIRouter(prefix="/api", tags=["schemes"])
logger = logging.getLogger(__name__)


def _scheme_summary(s: dict) -> dict:
    """Build the lightweight scheme summary for list responses."""
    return {
        "id": s["id"],
        "name": s["name"],
        "department": s["department"],
        "category": s.get("category"),
        "is_central": s.get("is_central", True),
        "state": s.get("state"),
        "benefits_summary": s["benefits"][:120] + "..." if len(s["benefits"]) > 120 else s["benefits"],
        "official_url": s.get("official_url", ""),
        "eligibility_summary": (
            s["eligibility"]["description"][:150] + "..."
            if len(s.get("eligibility", {}).get("description", "")) > 150
            else s.get("eligibility", {}).get("description", "")
        ),
        "source": s.get("source", "curated"),
        "source_type": s.get("source_type", "curated"),
        "verification_status": _derive_verification_status(s),
    }


def _derive_verification_status(s: dict) -> str:
    """Derive a compact verification status from scheme provenance."""
    source = s.get("source", "unknown")
    official_url = s.get("official_url", "")
    source_type = s.get("source_type", "unknown")
    
    # Known trusted sources
    trusted_sources = {"nsp", "aicte", "ugc", "mahadbt", "nsap", "nhfdc", "data.gov.in", "curated"}
    
    if source in trusted_sources and official_url:
        return "verified"
    elif source in trusted_sources:
        return "partially_verified"
    elif official_url:
        return "unverified_url"
    else:
        return "unverified"


def _scheme_with_match(s: dict) -> dict:
    """Build a scheme summary enriched with match/eligibility data."""
    base = _scheme_summary(s)
    base["match_score"] = s.get("match_score", 0)
    base["eligibility_status"] = s.get("eligibility_status", "unknown")
    base["matched_rules"] = s.get("matched_rules", [])
    base["failed_rules"] = s.get("failed_rules", [])
    base["missing_information"] = s.get("missing_information", [])
    base["match_reasons"] = s.get("match_reasons", [])
    return base


@router.get("/schemes", summary="List all available government schemes")
async def list_schemes(
    state: Optional[str] = Query(None, description="Filter by state"),
    category: Optional[str] = Query(None, description="Filter by category"),
    education: Optional[str] = Query(None, description="Filter by education level"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    query: Optional[str] = Query(None, description="Search by keyword"),
    user_id: Optional[str] = Query(None, description="Personalize with user profile"),
    source_type: Optional[str] = Query(None, description="Filter: 'curated' for actionable schemes, 'datagov_in' for supporting data, or omit for all"),
) -> List[dict]:
    """
    Return government schemes from the Hazela database.
    If user_id is provided, includes personalized match scoring and eligibility.
    If source_type is 'curated', only returns the 18 authoritative actionable scheme records.
    """
    schemes = await ingestion.search_schemes_from_store(
        query=query,
        state=state,
        category=category,
        education=education,
        gender=gender,
        source_type=source_type,
    )

    # If user_id provided, compute personalized ranking
    if user_id:
        profile = await fs.get_user(user_id)
        if profile:
            from app.services.scheme_ranking import rank_schemes_for_user
            ranked = await rank_schemes_for_user(schemes, profile)
            return [_scheme_with_match(s) for s in ranked]

    return [_scheme_summary(s) for s in schemes]


@router.get("/schemes/meta", summary="Get scheme ingestion metadata")
async def get_schemes_meta() -> dict:
    """
    Return metadata about the scheme database:
    - last_updated: timestamp of last successful ingestion
    - summary: counts from the last ingestion run
    """
    metadata = fs.get_ingestion_metadata()
    # Count schemes by source type
    all_schemes = await ingestion.get_all_schemes_from_store()
    curated_count = len([s for s in all_schemes if s.get("source_type") == "curated"])
    datagov_count = len([s for s in all_schemes if s.get("source_type") == "datagov_in"])
    return {
        "last_updated": metadata.get("last_updated"),
        "curated_count": curated_count,
        "datagov_count": datagov_count,
        "total_count": len(all_schemes),
        "summary": metadata.get("summary"),
    }


@router.get("/schemes/{scheme_id}", summary="Get full details of a specific scheme")
async def get_scheme(scheme_id: str) -> dict:
    """Retrieve the full scheme details including all eligibility criteria and required documents."""
    scheme = await ingestion.get_scheme_from_store(scheme_id)
    if scheme is None:
        raise HTTPException(
            status_code=404,
            detail=f"Scheme '{scheme_id}' not found. Use GET /api/schemes to list available schemes.",
        )
    return scheme


@router.post("/schemes/refresh", summary="Refresh scheme data from Data.gov.in")
async def refresh_schemes() -> dict:
    """
    Trigger a full refresh: reload curated schemes + fetch from Data.gov.in.
    This is the user-facing refresh action from the Explore page.
    """
    try:
        summary = await ingestion.run_full_ingestion()
        return {
            "status": "ok",
            "last_updated": summary.get("timestamp"),
            "curated": summary.get("curated", 0),
            "datagov_accepted": summary.get("datagov_accepted", 0),
        }
    except Exception as exc:
        logger.error("Refresh failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="Refresh failed. Showing previously loaded data.",
        )


@router.post("/schemes/ingest", summary="Trigger scheme ingestion from Data.gov.in")
async def trigger_ingestion() -> dict:
    """
    Trigger the full ingestion pipeline:
    1. Load/reload curated schemes from scheme_data.py
    2. Attempt fetch from Data.gov.in (if API key is configured)

    This endpoint is for administrative use and does not need to be called
    during normal operation.
    """
    try:
        summary = await ingestion.run_full_ingestion()
        return {
            "status": "ok",
            "summary": summary,
        }
    except Exception as exc:
        logger.error("Ingestion failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {exc}",
        )
