"""
Pydantic models for Scheme data.
The structured scheme schema matches what the Discovery Agent reasons over.
"""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, HttpUrl


class EligibilityCriteria(BaseModel):
    """Eligibility rules that the Discovery Agent evaluates."""

    min_age: Optional[int] = None
    max_age: Optional[int] = None
    max_annual_income_inr: Optional[int] = None
    states: Optional[List[str]] = None          # None = all India
    education_levels: Optional[List[str]] = None
    caste_categories: Optional[List[str]] = None
    gender: Optional[str] = None                # "male" | "female" | "any"
    disability_required: Optional[bool] = None
    description: str = ""                       # human-readable summary


class Scheme(BaseModel):
    """
    Structured scheme document.
    Stored in Firestore schemes/{schemeId} and also in the static fixture.
    NEVER invent scheme information — all fields sourced from official URLs.
    """

    id: str
    name: str
    department: str
    description: str
    eligibility: EligibilityCriteria
    benefits: str
    required_documents: List[str]
    deadline: Optional[date] = None             # None = rolling
    official_url: str                           # always .gov.in / nic.in / edu.in
    myscheme_url: Optional[str] = None
    category: Optional[str] = None             # "scholarship" | "welfare" | "loan"
    is_central: bool = True                     # central vs state scheme
    state: Optional[str] = None                 # set only for state schemes


class SchemeListItem(BaseModel):
    """Lightweight projection for GET /api/schemes list."""

    id: str
    name: str
    department: str
    category: Optional[str] = None
    is_central: bool
    state: Optional[str] = None
    deadline: Optional[date] = None
    benefits_summary: str
