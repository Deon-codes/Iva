"""
Scheme tools — ADK tool functions called by the Discovery Agent.

These are plain Python async functions decorated with type hints so the ADK
can auto-generate their tool schema. Each function has a clear docstring because
ADK passes the docstring to Gemini as the tool description.

Now uses the Firestore-backed scheme_ingestion service (with curated fallback)
instead of the in-memory scheme_data module.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.services import scheme_ingestion as ingestion

logger = logging.getLogger(__name__)


async def search_schemes(query: str, state: Optional[str] = None, gender: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Search for government schemes and scholarships matching the user's query.

    Args:
        query: Natural language query describing what the user is looking for,
               e.g. "scholarship for SC student in Maharashtra".
        state: Optional state filter, e.g. "Maharashtra". None means All India.
        gender: Optional gender filter: "male", "female", or None for any.

    Returns:
        List of matching scheme dicts with id, name, benefits, eligibility description.
    """
    schemes = await ingestion.search_schemes_from_store(
        query=query,
        state=state,
        gender=gender,
    )

    # Return lightweight projection for RAG context (not the full dict)
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "department": s["department"],
            "benefits": s["benefits"],
            "eligibility_summary": (
                s["eligibility"]["description"]
                if isinstance(s.get("eligibility"), dict)
                else s.get("eligibility", "")
            ),
            "required_documents": s.get("required_documents", []),
            "official_url": s.get("official_url", ""),
            "is_central": s.get("is_central", True),
            "state": s.get("state"),
        }
        for s in schemes
    ]


async def get_scheme_details(scheme_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the full details of a specific scheme by its ID.

    Args:
        scheme_id: The unique scheme identifier (e.g. "scheme_aicte_pragati").

    Returns:
        Full scheme dict including all eligibility criteria and required documents,
        or None if the scheme ID is not found.
    """
    return await ingestion.get_scheme_from_store(scheme_id)


async def check_eligibility_for_user(
    scheme_id: str,
    tool_context: Any = None,
) -> Dict[str, Any]:
    """
    Check eligibility for a scheme using the authenticated user's profile.
    User identity is injected by ADK via tool_context.user_id.
    """
    from app.services import firestore_service as fs

    try:
        from google.adk.tools.tool_context import ToolContext as _TC
    except ImportError:
        _TC = None

    uid = ""
    if tool_context is not None and getattr(tool_context, "user_id", None):
        uid = tool_context.user_id

    if not uid:
        return {
            "eligible": False,
            "eligibility_status": "insufficient_information",
            "reasons": ["User identity not available."],
            "missing_info": ["user_id"],
        }

    profile = await fs.get_user(uid)
    if profile is None:
        return {
            "eligible": False,
            "eligibility_status": "insufficient_information",
            "reasons": ["User profile not found."],
            "missing_info": ["profile"],
            "scheme_id": scheme_id,
        }

    return await check_eligibility(
        scheme_id=scheme_id,
        age=profile.get("age"),
        annual_income_inr=profile.get("annual_income_inr"),
        state=profile.get("state"),
        gender=profile.get("gender"),
        caste_category=profile.get("caste_category"),
        education_level=profile.get("education_level"),
    )


async def check_eligibility(
    scheme_id: str,
    age: Optional[int] = None,
    annual_income_inr: Optional[int] = None,
    state: Optional[str] = None,
    gender: Optional[str] = None,
    caste_category: Optional[str] = None,
    education_level: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Deterministically check whether a user profile is eligible for a specific scheme.

    Uses the canonical eligibility engine which returns a three-way result:
      - eligible: all checked criteria are met
      - not_eligible: a hard criterion fails
      - insufficient_information: required info is missing

    Args:
        scheme_id: The scheme to evaluate eligibility for.
        age: Applicant's age in years.
        annual_income_inr: Household annual income in INR.
        state: Applicant's state of domicile.
        gender: Applicant's gender ("male" or "female").
        caste_category: Caste/category (General, OBC, SC, ST, VJNT, SBC).
        education_level: Current education level (e.g. "UG", "12th", "diploma").

    Returns:
        Dict with keys:
            - eligible (bool) — True only for "eligible" status
            - eligibility_status (str) — "eligible" | "not_eligible" | "insufficient_information"
            - reasons (list of str) — why eligible or why not
            - missing_info (list of str) — profile fields needed but not provided
            - matched_rules (list of str) — criteria that matched
            - failed_rules (list of str) — criteria that failed
    """
    from app.services.scheme_ranking import evaluate_eligibility

    scheme = await ingestion.get_scheme_from_store(scheme_id)
    if scheme is None:
        return {
            "eligible": False,
            "eligibility_status": "not_eligible",
            "reasons": ["Scheme not found"],
            "missing_info": [],
            "matched_rules": [],
            "failed_rules": ["Scheme not found"],
            "scheme_id": scheme_id,
            "scheme_name": scheme_id,
        }

    # Build a profile dict from the individual parameters
    profile = {
        "age": age,
        "annual_income_inr": annual_income_inr,
        "state": state,
        "gender": gender,
        "caste_category": caste_category,
        "education_level": education_level,
    }
    # Remove None values so the engine treats them as missing
    profile = {k: v for k, v in profile.items() if v is not None}

    result = evaluate_eligibility(scheme, profile)

    return {
        "eligible": result["status"] == "eligible",
        "eligibility_status": result["status"],
        "reasons": result["reasons"],
        "missing_info": result["missing_information"],
        "matched_rules": result["matched_rules"],
        "failed_rules": result["failed_rules"],
        "scheme_id": scheme_id,
        "scheme_name": scheme.get("name", scheme_id),
    }
