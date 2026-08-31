"""
Application tools — ADK tool functions for creating and managing applications.
Used by the Form-Prep Agent.

User identity is automatically injected by the ADK framework via tool_context.user_id.
Tools do NOT need Gemini to pass user_id as an argument.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.services import firestore_service as fs
from app.services import scheme_ingestion as ingestion

try:
    from google.adk.tools.tool_context import ToolContext as _ToolContext
except ImportError:
    _ToolContext = None  # type: ignore[misc,assignment]

logger = logging.getLogger(__name__)

_Tc = _ToolContext if _ToolContext is not None else Any


def _get_uid(tool_context: Any = None, user_id: str = "") -> str:
    """Get user_id from ADK ToolContext (trusted, framework-injected) or fallback."""
    if tool_context is not None and getattr(tool_context, "user_id", None):
        return tool_context.user_id
    return user_id


async def create_application(
    user_id: str = "",
    scheme_id: str = "",
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> Dict[str, Any]:
    """
    Create a new scholarship application in DRAFT status.

    The user identity is automatically injected by the ADK framework.
    You do NOT need to pass user_id explicitly.

    Args:
        scheme_id: The scheme being applied for.

    Returns:
        Newly created application dict.
    """
    uid = _get_uid(tool_context, user_id)
    scheme = await ingestion.get_scheme_from_store(scheme_id)
    if scheme is None:
        return {"error": f"Scheme '{scheme_id}' not found. Cannot create application."}

    application = await fs.create_application(uid, scheme_id)
    await fs.append_application_event(
        application["id"],
        event_type="status_change",
        message=f"Application created for scheme: {scheme['name']}",
        triggered_by=uid,
        new_status="draft",
    )
    return application


async def get_application_status(application_id: str) -> Dict[str, Any]:
    """
    Retrieve the current status and details of an application.

    Args:
        application_id: The application identifier.

    Returns:
        Application dict or error dict.
    """
    application = await fs.get_application(application_id)
    if application is None:
        return {"error": f"Application '{application_id}' not found."}
    return application


def _build_profile_field(
    key: str,
    value: Any,
    source: str = "profile",
    verified: bool = False,
) -> Dict[str, Any]:
    """Build a field descriptor with source/trust metadata."""
    return {
        "value": value,
        "source": source,       # profile | document | user_input | scheme_default
        "verified": verified,
        "editable": True,        # may be overridden
    }


async def prepare_form_fields(
    user_id: str = "",
    scheme_id: str = "",
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> Dict[str, Any]:
    """
    Map the user's profile and available documents to a scheme's required form fields.

    The user identity is automatically injected by the ADK framework.
    You do NOT need to pass user_id explicitly. Just pass scheme_id.

    Returns:
        Dict with form_fields (each with value/source/verified), missing_fields,
        missing_documents, required_documents, ready_to_submit, scheme_name, notes.
    """
    uid = _get_uid(tool_context, user_id)

    scheme = await ingestion.get_scheme_from_store(scheme_id)
    if scheme is None:
        return {"error": f"Scheme '{scheme_id}' not found."}

    profile = await fs.get_user(uid)
    if profile is None:
        return {"error": "User profile not found. Please complete your profile first."}

    documents = await fs.list_documents_for_user(uid)
    doc_map: Dict[str, Dict[str, Any]] = {}
    for d in documents:
        dtype = d.get("document_type", "")
        if dtype not in doc_map:
            doc_map[dtype] = d

    verified_docs = {k: v for k, v in doc_map.items() if v.get("status") == "verified"}
    unverified_docs = {k: v for k, v in doc_map.items() if v.get("status") != "verified"}

    # Build form fields with source/trust metadata
    form_fields: Dict[str, Any] = {}

    # Generic document-extraction mapping: form_field -> (doc_type, extracted_key)
    # Verified documents generically take precedence over profile data.
    doc_extracted_mapping = {
        "annual_family_income": ("income_certificate", ["annual_income", "income"]),
        "applicant_name": ("aadhaar", ["name"]),
        "applicant_gender": ("aadhaar", ["gender"]),
        "applicant_age": ("aadhaar", ["dob", "date_of_birth"]),
        "institution_name": ("admission_letter", ["institution"]),
        "course_name": ("admission_letter", ["course"]),
        "caste_category": ("caste_certificate", ["category", "caste"]),
    }

    # Profile-sourced fields (fallback when no verified doc exists)
    profile_mapping = {
        "applicant_name": "name",
        "applicant_email": "email",
        "applicant_age": "age",
        "applicant_gender": "gender",
        "state_of_domicile": "state",
        "caste_category": "caste_category",
        "annual_family_income": "annual_income_inr",
        "education_level": "education_level",
        "institution_name": "institution_name",
        "course_name": "course_name",
    }

    for field_key, profile_key in profile_mapping.items():
        # 1. Check if a verified document provides this field
        if field_key in doc_extracted_mapping:
            doc_type, extracted_keys = doc_extracted_mapping[field_key]
            if doc_type in verified_docs:
                extracted = verified_docs[doc_type].get("extracted_fields", {})
                for ek in extracted_keys:
                    doc_val = extracted.get(ek)
                    if doc_val is not None:
                        # Special handling for age from dob
                        if ek in ("dob", "date_of_birth") and field_key == "applicant_age":
                            try:
                                from datetime import date as _date
                                dob = _date.fromisoformat(str(doc_val))
                                age = (_date.today() - dob).days // 365
                                form_fields[field_key] = _build_profile_field(
                                    field_key, age, source="document", verified=True
                                )
                            except (ValueError, TypeError):
                                pass
                            break
                        # Special handling for income (convert to int)
                        if field_key == "annual_family_income":
                            try:
                                form_fields[field_key] = _build_profile_field(
                                    field_key, int(doc_val), source="document", verified=True
                                )
                            except (ValueError, TypeError):
                                pass
                            break
                        form_fields[field_key] = _build_profile_field(
                            field_key, doc_val, source="document", verified=True
                        )
                        break

        # 2. Fall back to profile data if no verified doc provided this field
        if field_key not in form_fields or form_fields.get(field_key, {}).get("value") is None:
            value = profile.get(profile_key)
            form_fields[field_key] = _build_profile_field(
                field_key, value, source="profile", verified=False
            )

    # Document availability fields
    doc_field_mapping = {
        "aadhaar_available": "aadhaar",
        "income_certificate_available": "income_certificate",
        "marksheet_available": "marksheet",
        "admission_letter_available": "admission_letter",
        "caste_certificate_available": "caste_certificate",
        "bank_passbook_available": "bank_passbook",
    }

    for field_key, doc_type in doc_field_mapping.items():
        if doc_type in verified_docs:
            form_fields[field_key] = _build_profile_field(
                field_key, True, source="document", verified=True
            )
        elif doc_type in unverified_docs:
            form_fields[field_key] = _build_profile_field(
                field_key, True, source="document", verified=False
            )
        else:
            form_fields[field_key] = _build_profile_field(field_key, False, source="document", verified=False)

    # Determine missing critical fields
    critical_fields = [
        "applicant_name", "applicant_email", "state_of_domicile",
        "annual_family_income", "education_level", "institution_name",
    ]
    missing_fields: List[str] = []
    for f in critical_fields:
        ff = form_fields.get(f, {})
        if ff.get("value") is None:
            missing_fields.append(f)

    # Determine missing documents
    required_docs = scheme.get("required_documents", [])
    missing_docs: List[str] = []
    for doc_name in required_docs:
        doc_key = doc_name.lower().replace(" ", "_").replace("/", "_")
        found = False
        for available_key in doc_map:
            if doc_key in available_key or available_key in doc_key:
                found = True
                break
        if not found:
            missing_docs.append(doc_name)

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


async def list_user_applications(
    user_id: str = "",
    tool_context: _Tc = None,  # type: ignore[valid-type]
) -> List[Dict[str, Any]]:
    """
    List all applications for a user.

    The user identity is automatically injected by the ADK framework.
    You do NOT need to pass user_id explicitly.
    """
    uid = _get_uid(tool_context, user_id)
    return await fs.list_applications_for_user(uid)
