"""
Scheme tools — ADK tool functions called by the Discovery Agent.

These are plain Python async functions decorated with type hints so the ADK
can auto-generate their tool schema. Each function has a clear docstring because
ADK passes the docstring to Gemini as the tool description.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from app.services import scheme_data as _sd

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
    # Extract keywords from query for simple RAG retrieval
    keywords = [w for w in query.lower().split() if len(w) > 3]
    if state:
        keywords.append(state.lower())
    if gender:
        keywords.append(gender.lower())

    schemes = _sd.search_schemes_by_keywords(keywords) if keywords else _sd.get_all_schemes()

    # Apply gender filter deterministically (Gemini should not override this)
    if gender and gender.lower() in ("male", "female"):
        schemes = [
            s for s in schemes
            if s["eligibility"].get("gender") in (gender.lower(), "any", None)
        ]

    # Apply state filter
    if state:
        schemes = [
            s for s in schemes
            if s.get("state") is None or (s.get("state") or "").lower() == state.lower()
        ]

    # Return lightweight projection for RAG context (not the full dict)
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "department": s["department"],
            "benefits": s["benefits"],
            "eligibility_summary": s["eligibility"]["description"],
            "required_documents": s["required_documents"],
            "official_url": s["official_url"],
            "is_central": s["is_central"],
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
    return _sd.get_scheme_by_id(scheme_id)


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
            - eligible (bool)
            - reasons (list of str) — why eligible or why not
            - missing_info (list of str) — profile fields needed but not provided
    """
    scheme = _sd.get_scheme_by_id(scheme_id)
    if scheme is None:
        return {"eligible": False, "reasons": ["Scheme not found"], "missing_info": []}

    criteria = scheme["eligibility"]
    reasons: List[str] = []
    missing_info: List[str] = []
    eligible = True

    # Age check
    if criteria.get("min_age") or criteria.get("max_age"):
        if age is None:
            missing_info.append("age")
        else:
            if criteria.get("min_age") and age < criteria["min_age"]:
                eligible = False
                reasons.append(f"Age {age} is below minimum {criteria['min_age']}")
            if criteria.get("max_age") and age > criteria["max_age"]:
                eligible = False
                reasons.append(f"Age {age} exceeds maximum {criteria['max_age']}")

    # Income check
    if criteria.get("max_annual_income_inr"):
        if annual_income_inr is None:
            missing_info.append("annual_income_inr")
        elif annual_income_inr > criteria["max_annual_income_inr"]:
            eligible = False
            reasons.append(
                f"Annual income ₹{annual_income_inr:,} exceeds scheme limit "
                f"₹{criteria['max_annual_income_inr']:,}"
            )

    # State check
    if criteria.get("states"):
        if state is None:
            missing_info.append("state")
        elif state not in criteria["states"]:
            eligible = False
            reasons.append(
                f"Scheme is only available for {', '.join(criteria['states'])}; "
                f"applicant is from {state}"
            )

    # Gender check
    if criteria.get("gender") and criteria["gender"] not in ("any", None):
        if gender is None:
            missing_info.append("gender")
        elif gender.lower() != criteria["gender"].lower():
            eligible = False
            reasons.append(
                f"Scheme is for {criteria['gender']} students only; applicant is {gender}"
            )

    # Caste/category check
    if criteria.get("caste_categories"):
        if caste_category is None:
            missing_info.append("caste_category")
        elif caste_category not in criteria["caste_categories"]:
            eligible = False
            reasons.append(
                f"Scheme is for {', '.join(criteria['caste_categories'])} categories; "
                f"applicant category is {caste_category}"
            )

    # Education check
    if criteria.get("education_levels"):
        if education_level is None:
            missing_info.append("education_level")
        elif education_level not in criteria["education_levels"]:
            eligible = False
            reasons.append(
                f"Scheme requires education level {criteria['education_levels']}; "
                f"applicant is at {education_level}"
            )

    if eligible and not reasons:
        reasons.append("All checked eligibility criteria are met.")

    return {
        "eligible": eligible,
        "reasons": reasons,
        "missing_info": missing_info,
        "scheme_id": scheme_id,
        "scheme_name": scheme["name"],
    }
