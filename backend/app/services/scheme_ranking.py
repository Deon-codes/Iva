"""
Scheme ranking service — deterministic scoring of schemes against user profiles.

Uses explicit profile fields to compute:
  1. Eligibility status (eligible / not_eligible / insufficient_information)
  2. Match score (0-100) representing profile/scheme fit
  3. Rule breakdown (matched / failed / missing)
  4. Human-readable reasons

The score represents matching quality, NOT probability of approval.

Ranking order:
  1. ELIGIBLE schemes (highest match first)
  2. INSUFFICIENT_INFORMATION schemes
  3. NOT_ELIGIBLE schemes (lowest first)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


def evaluate_eligibility(
    scheme: Dict[str, Any],
    profile: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Deterministically evaluate eligibility for a scheme against a user profile.

    Returns a dict with:
      - status: "eligible" | "not_eligible" | "insufficient_information"
      - matched_rules: list of criteria the user satisfies
      - failed_rules: list of criteria the user fails
      - missing_information: list of profile fields needed but absent
      - reasons: human-readable explanation list
    """
    if profile is None:
        return {
            "status": "insufficient_information",
            "matched_rules": [],
            "failed_rules": [],
            "missing_information": ["profile"],
            "reasons": ["No user profile provided. Please complete your profile."],
        }

    eligibility = scheme.get("eligibility", {})
    matched_rules: List[str] = []
    failed_rules: List[str] = []
    missing_information: List[str] = []

    # ── State check ──────────────────────────────────────────────────────
    scheme_states = eligibility.get("states")
    user_state = profile.get("state")
    if scheme_states is not None:
        if user_state is None:
            missing_information.append("state")
        elif user_state in scheme_states:
            matched_rules.append(f"Maharashtra domicile" if user_state == "Maharashtra" else f"{user_state} domicile")
        else:
            failed_rules.append(f"Scheme requires: {', '.join(scheme_states)}")

    # ── Income check ─────────────────────────────────────────────────────
    income_limit = eligibility.get("max_annual_income_inr")
    user_income = profile.get("annual_income_inr") or profile.get("income")
    if income_limit is not None:
        if user_income is None:
            missing_information.append("annual_income")
        elif user_income <= income_limit:
            matched_rules.append(f"Family income within limit")
        else:
            failed_rules.append(f"Income exceeds limit of {income_limit}")

    # ── Gender check ─────────────────────────────────────────────────────
    scheme_gender = eligibility.get("gender")
    user_gender = (profile.get("gender") or "").lower()
    if scheme_gender and scheme_gender not in ("any", None):
        if not user_gender:
            missing_information.append("gender")
        elif user_gender == scheme_gender.lower():
            matched_rules.append(f"Gender: {user_gender}")
        else:
            failed_rules.append(f"Scheme requires {scheme_gender} applicants")

    # ── Category check ───────────────────────────────────────────────────
    scheme_cats = eligibility.get("caste_categories")
    user_cat = profile.get("caste_category")
    if scheme_cats is not None:
        if user_cat is None:
            missing_information.append("category")
        elif user_cat in scheme_cats:
            matched_rules.append(f"Category: {user_cat}")
        else:
            failed_rules.append(f"Scheme requires: {', '.join(scheme_cats)}")

    # ── Education check ──────────────────────────────────────────────────
    scheme_edu = eligibility.get("education_levels")
    user_edu = profile.get("education_level")
    if scheme_edu is not None:
        if user_edu is None:
            missing_information.append("education_level")
        elif user_edu in scheme_edu:
            matched_rules.append(f"Education: {user_edu}")
        else:
            failed_rules.append(f"Scheme requires education level: {', '.join(scheme_edu)}")

    # ── Age check ────────────────────────────────────────────────────────
    min_age = eligibility.get("min_age")
    max_age = eligibility.get("max_age")
    user_age = profile.get("age")
    if min_age is not None or max_age is not None:
        if user_age is None:
            missing_information.append("age")
        else:
            age_ok = True
            if min_age and user_age < min_age:
                age_ok = False
                failed_rules.append(f"Age {user_age} is below minimum {min_age}")
            if max_age and user_age > max_age:
                age_ok = False
                failed_rules.append(f"Age {user_age} exceeds maximum {max_age}")
            if age_ok:
                matched_rules.append(f"Age: {user_age}")

    # ── Disability check ─────────────────────────────────────────────────
    requires_disability = eligibility.get("disability_required")
    user_disability = profile.get("disability")
    if requires_disability is True:
        if user_disability is None:
            missing_information.append("disability_status")
        elif user_disability:
            matched_rules.append("Disability requirement met")
        else:
            failed_rules.append("Scheme requires disability status")

    # ── Determine status ─────────────────────────────────────────────────
    if failed_rules:
        status = "not_eligible"
    elif missing_information:
        status = "insufficient_information"
    else:
        status = "eligible"

    # ── Build human-readable reasons ─────────────────────────────────────
    reasons: List[str] = []
    if matched_rules:
        reasons.append("Matches: " + "; ".join(matched_rules))
    if failed_rules:
        reasons.append("Does not meet: " + "; ".join(failed_rules))
    if missing_information:
        reasons.append("Need to confirm: " + ", ".join(missing_information))
    if not reasons:
        reasons.append("All checked criteria are met.")

    return {
        "status": status,
        "matched_rules": matched_rules,
        "failed_rules": failed_rules,
        "missing_information": missing_information,
        "reasons": reasons,
    }


def compute_match_score(
    scheme: Dict[str, Any],
    profile: Optional[Dict[str, Any]],
) -> Tuple[int, Dict[str, Any]]:
    """
    Compute a deterministic match score for a scheme against a user profile.

    Returns:
      Tuple of (score: int 0-100, eligibility_result: dict)
    """
    eligibility_result = evaluate_eligibility(scheme, profile)

    if profile is None:
        return 0, eligibility_result

    score = 0
    max_score = 0
    elig = scheme.get("eligibility", {})

    # ── State match (25 points) ────────────────────────────────────────────
    max_score += 25
    scheme_states = elig.get("states")
    user_state = profile.get("state")
    if scheme_states is None:
        score += 25
    elif user_state and user_state in scheme_states:
        score += 25

    # ── Education match (20 points) ────────────────────────────────────────
    max_score += 20
    scheme_edu = elig.get("education_levels")
    user_edu = profile.get("education_level")
    if scheme_edu is None:
        score += 20
    elif user_edu and user_edu in scheme_edu:
        score += 20

    # ── Category match (20 points) ─────────────────────────────────────────
    max_score += 20
    scheme_cats = elig.get("caste_categories")
    user_cat = profile.get("caste_category")
    if scheme_cats is None:
        score += 20
    elif user_cat and user_cat in scheme_cats:
        score += 20

    # ── Income eligibility (20 points) ─────────────────────────────────────
    max_score += 20
    income_limit = elig.get("max_annual_income_inr")
    user_income = profile.get("annual_income_inr") or profile.get("income")
    if income_limit is None:
        score += 20
    elif user_income is not None and user_income <= income_limit:
        score += 20

    # ── Gender match (10 points) ───────────────────────────────────────────
    max_score += 10
    scheme_gender = elig.get("gender")
    user_gender = (profile.get("gender") or "").lower()
    if scheme_gender in (None, "any"):
        score += 10
    elif user_gender and user_gender == scheme_gender.lower():
        score += 10

    # ── Age match (5 points) ───────────────────────────────────────────────
    max_score += 5
    min_age = elig.get("min_age")
    max_age = elig.get("max_age")
    user_age = profile.get("age")
    if min_age is None and max_age is None:
        score += 5
    elif user_age is not None:
        age_ok = True
        if min_age and user_age < min_age:
            age_ok = False
        if max_age and user_age > max_age:
            age_ok = False
        if age_ok:
            score += 5

    final_score = round((score / max_score) * 100) if max_score > 0 else 0
    return final_score, eligibility_result


# ── Status sort order: eligible < insufficient < not_eligible ──────────────
_STATUS_ORDER = {
    "eligible": 0,
    "insufficient_information": 1,
    "not_eligible": 2,
}


async def rank_schemes_for_user(
    schemes: List[Dict[str, Any]],
    profile: Optional[Dict[str, Any]],
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    Rank schemes against a user profile with eligibility and score.

    Returns schemes sorted:
      1. ELIGIBLE (highest score first)
      2. INSUFFICIENT_INFORMATION
      3. NOT_ELIGIBLE

    Each scheme dict gets added:
      - match_score (0-100)
      - eligibility_status
      - matched_rules
      - failed_rules
      - missing_information
    """
    scored = []
    for scheme in schemes:
        score, elig = compute_match_score(scheme, profile)
        scored.append({
            **scheme,
            "match_score": score,
            "eligibility_status": elig["status"],
            "matched_rules": elig["matched_rules"],
            "failed_rules": elig["failed_rules"],
            "missing_information": elig["missing_information"],
            "match_reasons": elig["reasons"],
        })

    # Sort: eligible first, then insufficient, then not_eligible.
    # Within each group, higher score first.
    scored.sort(
        key=lambda s: (_STATUS_ORDER.get(s["eligibility_status"], 1), -s["match_score"])
    )
    return scored[:limit]
