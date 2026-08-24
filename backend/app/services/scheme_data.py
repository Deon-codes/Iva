"""
Static scheme fixture — 3 carefully chosen real Indian government schemes.

Sources (verified against official URLs — do not invent or modify):
1. PM National Scholarship Portal → https://scholarships.gov.in
2. Maharashtra Rajarshi Chhatrapati Shahu Maharaj Scholarship → https://mahadbt.maharashtra.gov.in
3. AICTE Pragati Scholarship for Girls → https://www.aicte-india.org/schemes/students-development-schemes/Pragati-Scholarship

These serve as the RAG corpus the Discovery Agent retrieves and reasons over.
NEVER add a scheme without a verified official_url.
"""

from __future__ import annotations

from typing import Dict, List, Any


SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "scheme_pm_nsp_merit",
        "name": "Prime Minister's Scholarship Scheme for Central Armed Police Forces / Railway Protection Force",
        "department": "Ministry of Home Affairs / Ministry of Railways",
        "description": (
            "Provides scholarships to dependent wards and widows of Central Armed Police "
            "Forces (CAPF) and Railway Protection Force (RPF) personnel who are killed or "
            "disabled in action. Covers professional degree courses."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": None,
            "states": None,           # All India
            "education_levels": ["UG", "professional"],
            "caste_categories": None, # All categories
            "gender": "any",
            "disability_required": None,
            "description": (
                "Dependent wards/widows of CAPF/RPF personnel killed or disabled in action. "
                "Enrolled in first year of professional degree (BE/BTech/BDS/MBBS/BEd/BBA/BCA/BSc-Nursing etc). "
                "Minimum 60% in qualifying exam."
            ),
        },
        "benefits": "₹3,000/month for boys; ₹3,600/month for girls. Duration: 1–5 years per course.",
        "required_documents": [
            "Aadhaar Card",
            "PPO / Service Certificate of parent",
            "Marksheet of qualifying exam (12th or equivalent)",
            "Bank account details",
            "Admission letter from institution",
            "Income certificate (if applicable)",
        ],
        "deadline": None,
        "official_url": "https://scholarships.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/pmss-capf",
        "category": "scholarship",
        "is_central": True,
        "state": None,
    },
    {
        "id": "scheme_maha_rajarshi_shahu",
        "name": "Rajarshi Chhatrapati Shahu Maharaj Scholarship (Maharashtra)",
        "department": "Social Justice & Special Assistance Department, Maharashtra",
        "description": (
            "State scholarship for SC/ST/OBC students from Maharashtra pursuing "
            "higher education. Covers tuition, maintenance allowance, and book grant "
            "for courses at recognised institutions."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,    # ₹8 lakh annual family income
            "states": ["Maharashtra"],
            "education_levels": ["UG", "PG", "diploma"],
            "caste_categories": ["SC", "ST", "OBC", "VJNT", "SBC"],
            "gender": "any",
            "disability_required": None,
            "description": (
                "Maharashtra domicile. SC/ST/OBC/VJNT/SBC category. "
                "Family income ≤ ₹8 lakh/year. Enrolled in UG/PG/diploma at recognised Maharashtra institution. "
                "Minimum 50% in previous qualifying exam."
            ),
        },
        "benefits": (
            "Tuition fee reimbursement (full for SC/ST; partial for OBC). "
            "Maintenance allowance ₹650–₹1,200/month. Book grant ₹600–₹1,000/year."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Maharashtra domicile certificate",
            "Caste certificate",
            "Caste validity certificate",
            "Income certificate (family)",
            "Previous year marksheet",
            "Current admission receipt / bonafide certificate",
            "Bank passbook (student's own account)",
        ],
        "deadline": None,
        "official_url": "https://mahadbt.maharashtra.gov.in",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/rcsmss",
        "category": "scholarship",
        "is_central": False,
        "state": "Maharashtra",
    },
    {
        "id": "scheme_aicte_pragati",
        "name": "AICTE Pragati Scholarship for Girl Students (Technical Degree/Diploma)",
        "department": "All India Council for Technical Education (AICTE)",
        "description": (
            "Empowers girl students pursuing technical education (AICTE-approved degree/diploma). "
            "One scholarship per family; maximum two per district per year. "
            "Covers tuition, contingency, and incidentals."
        ),
        "eligibility": {
            "min_age": None,
            "max_age": None,
            "max_annual_income_inr": 800000,    # ₹8 lakh family income cap
            "states": None,                      # All India
            "education_levels": ["UG", "diploma"],
            "caste_categories": None,            # All categories
            "gender": "female",
            "disability_required": None,
            "description": (
                "Girl student enrolled in AICTE-approved degree (year 1 or 2) or diploma program. "
                "Family income ≤ ₹8 lakh/year. "
                "Only one girl per family eligible. Not availing any other central scholarship."
            ),
        },
        "benefits": (
            "₹50,000/year for degree students; ₹30,000/year for diploma students. "
            "Covers tuition fee + contingency. Duration: up to 4 years (degree) / 3 years (diploma)."
        ),
        "required_documents": [
            "Aadhaar Card",
            "Income certificate (family)",
            "Admission letter from AICTE-approved institution",
            "Previous year marksheet",
            "Bank account details (student's own account, Aadhaar-linked)",
            "Self-declaration: no other central scholarship",
            "Category certificate (if SC/ST/OBC, for priority)",
        ],
        "deadline": None,
        "official_url": "https://www.aicte-india.org/schemes/students-development-schemes/Pragati-Scholarship",
        "myscheme_url": "https://www.myscheme.gov.in/schemes/ps-td",
        "category": "scholarship",
        "is_central": True,
        "state": None,
    },
]

# Index by ID for O(1) lookup
SCHEME_INDEX: Dict[str, Dict[str, Any]] = {s["id"]: s for s in SCHEMES}


def get_all_schemes() -> List[Dict[str, Any]]:
    """Return the full list of schemes."""
    return SCHEMES


def get_scheme_by_id(scheme_id: str) -> Dict[str, Any] | None:
    """Return a single scheme by ID, or None."""
    return SCHEME_INDEX.get(scheme_id)


def search_schemes_by_keywords(keywords: List[str]) -> List[Dict[str, Any]]:
    """
    Simple keyword search over scheme name + description + eligibility description.
    Used by the Discovery Agent for RAG retrieval.
    """
    keywords_lower = [kw.lower() for kw in keywords]
    results = []
    for scheme in SCHEMES:
        searchable = " ".join([
            scheme["name"],
            scheme["description"],
            scheme["eligibility"]["description"],
            scheme.get("state") or "",
        ]).lower()
        if any(kw in searchable for kw in keywords_lower):
            results.append(scheme)
    return results
