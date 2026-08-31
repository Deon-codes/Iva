"""
Scheme ingestion service — loads curated schemes into Firestore
and optionally fetches from Data.gov.in.

Data flow:
    scheme_data.py (curated) → Firestore (cache) → /api/schemes → Frontend/Agent

This service should NOT run on every user request.
It is called:
  - At application startup (seed curated schemes)
  - Via an ingestion endpoint (refresh from Data.gov.in)
  - During tests (populate in-memory store)

The ingestion pipeline does NOT call Gemini. It is purely deterministic.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.services import firestore_service as fs
from app.services import scheme_data as curated

logger = logging.getLogger(__name__)


# ── Normalization from Data.gov.in ───────────────────────────────────────────

def normalize_datagov_record(
    record: Dict[str, Any],
    resource_config: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Normalize a raw Data.gov.in record into the canonical scheme structure.

    Data.gov.in records are typically beneficiary/statistics data, not scheme definitions.
    Each record usually represents ONE state's data for a specific scheme.
    We normalize each state-record into a separate scheme entry with provenance.

    Args:
        record: Raw record from Data.gov.in API.
        resource_config: Resource configuration from SCHEME_SOURCES.

    Returns:
        Normalized scheme dict, or None if the record is not usable.
    """
    # Data.gov.in records have arbitrary field names depending on the resource.
    # This normalization is best-effort — we only map fields we can confidently match.

    # Get the scheme name from the resource title (not from individual records)
    resource_title = resource_config.get("title", "")
    org = resource_config.get("organization", "Government of India")
    resource_id = resource_config.get("resource_id", "")
    source_url = resource_config.get("source_url", "https://data.gov.in")

    # Get state from the record
    state = (
        record.get("state_ut")
        or record.get("states__uts")
        or record.get("state")
        or record.get("State")
    )
    if state:
        state = str(state).strip()
    if state and state.lower() in ("all india", "all", "central", "", "india"):
        state = None

    # Generate a unique scheme ID from resource + state
    state_slug = (state or "all_india").lower().replace(" ", "_").replace("&", "and").replace("/", "_")
    scheme_id = f"datagov_{resource_id[:8]}_{state_slug}"

    # Extract beneficiary/financial data from year-specific fields
    beneficiary_data = {}
    total_beneficiaries = 0
    for key, value in record.items():
        if key in ("sl__no_", "state_ut", "states__uts"):
            continue
        if value is not None and str(value).strip():
            try:
                num = int(str(value).replace(",", "").strip())
                beneficiary_data[key] = num
                total_beneficiaries += num
            except (ValueError, TypeError):
                pass

    # Build description from available data
    description_parts = [f"Government scholarship scheme: {resource_title}"]
    if state:
        description_parts.append(f"Data for {state}")
    if total_beneficiaries > 0:
        description_parts.append(f"Total beneficiaries across reported years: {total_beneficiaries:,}")
    if beneficiary_data:
        year_summary = ", ".join(f"{k}: {v:,}" for k, v in list(beneficiary_data.items())[:3])
        description_parts.append(f"Year-wise data: {year_summary}")

    name = f"{resource_title}"
    if state:
        name += f" — {state}"

    normalized: Dict[str, Any] = {
        "id": scheme_id,
        "name": name,
        "department": org,
        "description": ". ".join(description_parts),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": None,
            "states": [state] if state else None,
            "education_levels": None,
            "caste_categories": None,
            "gender": "any",
            "disability_required": None,
            "description": f"Beneficiary data from {resource_title}. Refer to official source for eligibility details.",
        },
        "benefits": f"See beneficiary data: {total_beneficiaries:,} total across reported years." if total_beneficiaries else "Refer to official source.",
        "required_documents": [],
        "deadline": None,
        "official_url": source_url,
        "myscheme_url": None,
        "category": resource_config.get("category", "scholarship"),
        "is_central": state is None,
        "state": state,
        "source": "data.gov.in",
        "source_type": "datagov_in",
        "resource_id": resource_id,
        "last_updated": None,
        "active": True,
        # Raw supporting data preserved for provenance
        "supporting_data": {
            "beneficiary_counts": beneficiary_data,
            "total_beneficiaries": total_beneficiaries,
        },
    }

    return normalized


# ── Ingestion ────────────────────────────────────────────────────────────────

async def ingest_curated_schemes() -> int:
    """
    Load all curated schemes from scheme_data.py into Firestore / in-memory store.
    This is idempotent — running multiple times does not create duplicates.

    Returns:
        Number of schemes ingested.
    """
    count = 0
    for scheme in curated.get_all_schemes():
        await fs.upsert_scheme(scheme["id"], scheme)
        count += 1

    logger.info("Ingested %d curated schemes into Firestore", count)
    return count


async def ingest_datagov_resource(
    resource_config: Dict[str, Any],
    max_pages: int = 5,
) -> Tuple[int, int]:
    """
    Fetch data from a Data.gov.in resource, normalize, and store in Firestore.

    Args:
        resource_config: Resource configuration from SCHEME_SOURCES.
        max_pages: Maximum pages to fetch.

    Returns:
        Tuple of (records accepted, records rejected).
    """
    from app.services.datagov_client import get_datagov_client

    client = get_datagov_client()
    resource_id = resource_config["resource_id"]

    if not resource_config.get("api_available", False):
        logger.warning("Resource %s does not have API access — skipping", resource_id)
        return 0, 0

    raw_records = await client.fetch_all_pages(
        resource_id=resource_id,
        max_pages=max_pages,
    )

    if not raw_records:
        logger.warning("No records fetched from resource %s", resource_id)
        return 0, 0

    accepted = 0
    rejected = 0

    for record in raw_records:
        normalized = normalize_datagov_record(record, resource_config)
        if normalized is None:
            rejected += 1
            continue

        await fs.upsert_scheme(normalized["id"], normalized)
        accepted += 1

    logger.info(
        "Resource %s: %d accepted, %d rejected out of %d raw records",
        resource_id, accepted, rejected, len(raw_records),
    )
    return accepted, rejected


async def run_full_ingestion() -> Dict[str, Any]:
    """
    Run the complete ingestion pipeline:
    1. Load curated schemes (primary source)
    2. Attempt Data.gov.in fetch for configured resources (best-effort)

    Returns:
        Summary dict with counts.
    """
    summary: Dict[str, Any] = {
        "curated": 0,
        "datagov_accepted": 0,
        "datagov_rejected": 0,
        "datagov_resources_attempted": 0,
        "datagov_errors": [],
        "timestamp": datetime.utcnow().isoformat(),
    }

    # 1. Curated schemes (always available, no external calls)
    summary["curated"] = await ingest_curated_schemes()

    # 2. Data.gov.in (best-effort — always wrapped in try/except so timeouts
    #    never block the curated scheme loading)
    from app.config import settings
    if settings.datagov_enabled:
        from app.services.datagov_client import SCHEME_SOURCES
        import asyncio
        for resource in SCHEME_SOURCES:
            try:
                # Use a short per-resource timeout so slow servers
                # don't block the entire ingestion pipeline
                accepted, rejected = await asyncio.wait_for(
                    ingest_datagov_resource(resource, max_pages=1),
                    timeout=20.0,
                )
                summary["datagov_accepted"] += accepted
                summary["datagov_rejected"] += rejected
                summary["datagov_resources_attempted"] += 1
            except asyncio.TimeoutError:
                msg = f"Timeout fetching resource {resource.get('resource_id')}"
                logger.warning(msg)
                summary["datagov_errors"].append(msg)
            except Exception as exc:
                msg = f"Failed to ingest resource {resource.get('resource_id')}: {exc}"
                logger.error(msg)
                summary["datagov_errors"].append(msg)
    else:
        logger.info("Data.gov.in API key not configured — using curated schemes only")

    logger.info("Full ingestion complete: %s", summary)
    # Record metadata for the /api/schemes/meta endpoint
    from app.services.firestore_service import record_ingestion
    record_ingestion(summary)
    return summary


# ── Query Interface ──────────────────────────────────────────────────────────

async def get_all_schemes_from_store() -> List[Dict[str, Any]]:
    """
    Get all schemes from Firestore/store PLUS curated fallback.

    Always returns curated schemes. Any additional schemes from
    Data.gov.in ingestion (stored in Firestore/in-memory) are merged in.
    Deduplicates by scheme ID.
    """
    # Start with curated schemes as the base
    result_by_id: Dict[str, Dict[str, Any]] = {
        s["id"]: s for s in curated.get_all_schemes()
    }

    # Merge in any schemes from Firestore/in-memory store
    try:
        store_schemes = await fs.list_schemes()
        for s in store_schemes:
            sid = s.get("id", "")
            if sid and sid not in result_by_id:
                result_by_id[sid] = s
    except Exception as exc:
        logger.warning("Failed to list schemes from Firestore: %s", exc)

    return list(result_by_id.values())


async def get_scheme_from_store(scheme_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single scheme by ID from Firestore (with curated fallback).
    """
    try:
        scheme = await fs.get_scheme(scheme_id)
        if scheme:
            return scheme
    except Exception as exc:
        logger.warning("Failed to get scheme %s from Firestore: %s", scheme_id, exc)

    # Fallback to curated data
    return curated.get_scheme_by_id(scheme_id)


async def search_schemes_from_store(
    query: Optional[str] = None,
    state: Optional[str] = None,
    category: Optional[str] = None,
    education: Optional[str] = None,
    gender: Optional[str] = None,
    source_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Search schemes with optional filters.
    Uses keyword search against name/description/eligibility.
    
    Args:
        source_type: If provided, filter by source_type ('curated' for actionable schemes,
                     'datagov_in' for Data.gov.in supporting records).
    """
    all_schemes = await get_all_schemes_from_store()

    # Filter by source_type if specified
    if source_type:
        all_schemes = [
            s for s in all_schemes
            if (s.get("source_type") or "curated") == source_type
        ]

    results = all_schemes

    # Keyword filter
    if query:
        keywords = [kw.lower() for kw in query.split() if len(kw) > 2]
        if keywords:
            filtered = []
            for s in results:
                searchable = " ".join([
                    s.get("name", ""),
                    s.get("description", ""),
                    s.get("eligibility", {}).get("description", "") if isinstance(s.get("eligibility"), dict) else "",
                    s.get("department", ""),
                    s.get("category", "") or "",
                ]).lower()
                if any(kw in searchable for kw in keywords):
                    filtered.append(s)
            results = filtered

    # State filter
    if state:
        results = [
            s for s in results
            if s.get("state") is None or (s.get("state") or "").lower() == state.lower()
        ]

    # Category filter
    if category:
        results = [
            s for s in results
            if (s.get("category") or "").lower() == category.lower()
        ]

    # Gender filter
    if gender and gender.lower() in ("male", "female"):
        results = [
            s for s in results
            if s.get("eligibility", {}).get("gender") in (gender.lower(), "any", None)
        ]

    return results
