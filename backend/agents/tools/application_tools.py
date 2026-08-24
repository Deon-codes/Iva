"""
Application tools — ADK tool functions for creating and managing applications.
Used by the Form-Prep Agent.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.services import firestore_service as fs
from app.services import scheme_data as sd

logger = logging.getLogger(__name__)


async def create_application(user_id: str, scheme_id: str) -> Dict[str, Any]:
    """
    Create a new scholarship application in DRAFT status.

    Args:
        user_id: The user who is applying.
        scheme_id: The scheme being applied for.

    Returns:
        Newly created application dict (the shared contract shape).
    """
    # Validate scheme exists
    scheme = sd.get_scheme_by_id(scheme_id)
    if scheme is None:
        return {"error": f"Scheme '{scheme_id}' not found. Cannot create application."}

    application = await fs.create_application(user_id, scheme_id)
    await fs.append_application_event(
        application["id"],
        event_type="status_change",
        message=f"Application created for scheme: {scheme['name']}",
        triggered_by=user_id,
        new_status="draft",
    )
    return application


async def get_application_status(application_id: str) -> Dict[str, Any]:
    """
    Retrieve the current status and details of an application.

    Args:
        application_id: The application identifier (e.g. "app_a1b2c3d4").

    Returns:
        Application dict with status, nextAction, rejectionReason, etc.
        or an error dict if not found.
    """
    application = await fs.get_application(application_id)
    if application is None:
        return {"error": f"Application '{application_id}' not found."}
    return application


async def prepare_form_fields(user_id: str, scheme_id: str) -> Dict[str, Any]:
    """
    Map the user's profile and available documents to a scheme's required form fields.
    This is the core of the Form-Preparation Agent's work.

    Args:
        user_id: The user whose profile and documents to read.
        scheme_id: The scheme whose required fields to map against.

    Returns:
        Dict with:
            - form_fields (dict): field_name → value (None if missing)
            - missing_fields (list): fields that could not be auto-filled
            - required_documents (list): document types the scheme requires
            - ready_to_submit (bool): True if all required fields are populated
            - notes (str): Human-readable summary for the agent to present to user
    """
    # Get scheme
    scheme = sd.get_scheme_by_id(scheme_id)
    if scheme is None:
        return {"error": f"Scheme '{scheme_id}' not found."}

    # Get user profile
    profile = await fs.get_user(user_id)
    if profile is None:
        return {"error": f"User profile for '{user_id}' not found. Please create a profile first."}

    # Get user's documents
    documents = await fs.list_documents_for_user(user_id)
    doc_types_available = {d["document_type"]: d for d in documents if d.get("status") == "verified"}

    # Map profile to standard form fields
    form_fields: Dict[str, Any] = {
        "applicant_name": profile.get("name"),
        "applicant_email": profile.get("email"),
        "applicant_age": profile.get("age"),
        "applicant_gender": profile.get("gender"),
        "state_of_domicile": profile.get("state"),
        "caste_category": profile.get("caste_category"),
        "annual_family_income": profile.get("annual_income_inr"),
        "education_level": profile.get("education_level"),
        "institution_name": profile.get("institution_name"),
        "course_name": profile.get("course_name"),
        "aadhaar_available": "aadhaar" in doc_types_available,
        "income_certificate_available": "income_certificate" in doc_types_available,
        "marksheet_available": "marksheet" in doc_types_available,
        "admission_letter_available": "admission_letter" in doc_types_available,
        "caste_certificate_available": "caste_certificate" in doc_types_available,
        "bank_passbook_available": "bank_passbook" in doc_types_available,
    }

    # Determine missing fields
    critical_fields = ["applicant_name", "applicant_email", "state_of_domicile",
                       "annual_family_income", "education_level", "institution_name"]
    missing_fields: List[str] = [f for f in critical_fields if form_fields.get(f) is None]

    # Check document readiness
    required_docs = scheme.get("required_documents", [])
    missing_docs: List[str] = []
    for doc in required_docs:
        doc_key = doc.lower().replace(" ", "_").replace("/", "_")
        if not form_fields.get(f"{doc_key}_available", False):
            # Check approximate match
            matched = any(
                doc_key in available_key or available_key in doc_key
                for available_key in doc_types_available
            )
            if not matched:
                missing_docs.append(doc)

    ready = len(missing_fields) == 0 and len(missing_docs) == 0

    notes_parts = []
    if missing_fields:
        notes_parts.append(f"Missing profile fields: {', '.join(missing_fields)}.")
    if missing_docs:
        notes_parts.append(f"Missing documents: {', '.join(missing_docs)}.")
    if ready:
        notes_parts.append("All required information is available. The form is ready for your review.")

    return {
        "form_fields": form_fields,
        "missing_fields": missing_fields,
        "missing_documents": missing_docs,
        "required_documents": required_docs,
        "ready_to_submit": ready,
        "scheme_name": scheme["name"],
        "notes": " ".join(notes_parts) or "Form preparation complete.",
    }


async def list_user_applications(user_id: str) -> List[Dict[str, Any]]:
    """
    List all applications for a user.

    Args:
        user_id: The user identifier.

    Returns:
        List of application dicts.
    """
    return await fs.list_applications_for_user(user_id)
