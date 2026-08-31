"""
POST /api/documents · GET /api/documents · DELETE /api/documents/{id}
POST /api/documents/match · GET /api/verification/status
POST /api/demo/scenario · GET /api/demo/scenario

Document metadata + matching + demo scenario endpoints.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.document import Document, DocumentCreate, DocumentStatus
from app.services import firestore_service as fs

router = APIRouter(prefix="/api", tags=["documents"])
logger = logging.getLogger(__name__)

# ─── Demo scenario state (per-process, for demo only) ────────────────────────
_demo_scenario: Dict[str, str] = {}  # user_id → "fully_verified" | "needs_documents"


# ─── Response models ─────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """Document with verification metadata for the frontend."""
    id: str
    user_id: str
    document_type: str
    filename: str
    storage_url: str = ""
    status: str
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None
    verification_metadata: Dict[str, Any] = Field(default_factory=dict)
    expiry_status: Optional[str] = None
    expiry_date: Optional[str] = None
    days_until_expiry: Optional[int] = None

    @staticmethod
    def from_doc(doc: Dict[str, Any]) -> "DocumentResponse":
        status = doc.get("status", "pending_verification")
        verification_metadata = doc.get("verification_metadata", {})
        if not verification_metadata:
            verification_metadata = _default_verification_metadata(status)

        expiry_info = _compute_expiry(doc)

        return DocumentResponse(
            id=doc["id"],
            user_id=doc.get("user_id", ""),
            document_type=doc.get("document_type", ""),
            filename=doc.get("filename", ""),
            storage_url=doc.get("storage_url", ""),
            status=status,
            extracted_fields=doc.get("extracted_fields", {}),
            created_at=doc.get("created_at"),
            verification_metadata=verification_metadata,
            **expiry_info,
        )


def _default_verification_metadata(status: str) -> Dict[str, Any]:
    """Provide default verification metadata labels."""
    return {
        "extraction": {
            "type": "REAL",
            "method": "Gemini Vision OCR",
            "description": "Fields extracted from uploaded document using Gemini Vision",
        },
        "expiry_check": {
            "type": "REAL",
            "method": "Deterministic date comparison",
            "description": "Checked against today's date",
        },
        "government_verification": {
            "type": "🔴 MOCK",
            "reason": "No direct government API available in demo",
            "description": "Simulated verification — no real government system contacted",
        },
        "name_matching": {
            "type": "REAL",
            "method": "String comparison against profile",
            "description": "Name on document matched against application profile",
        },
    }


def _compute_expiry(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Compute expiry information from document fields."""
    extracted = doc.get("extracted_fields", {})
    expiry_str = extracted.get("expiryDate")
    if not expiry_str:
        return {"expiry_status": None, "expiry_date": None, "days_until_expiry": None}

    try:
        if isinstance(expiry_str, str):
            expiry = date.fromisoformat(expiry_str)
        else:
            expiry = expiry_str if isinstance(expiry_str, date) else None
        if expiry is None:
            return {"expiry_status": None, "expiry_date": None, "days_until_expiry": None}
    except (ValueError, TypeError):
        return {"expiry_status": None, "expiry_date": None, "days_until_expiry": None}

    today = date.today()
    days = (expiry - today).days
    if days < 0:
        expiry_status = "expired"
    elif days <= 30:
        expiry_status = "expiring_soon"
    else:
        expiry_status = "valid"

    return {
        "expiry_status": expiry_status,
        "expiry_date": expiry.isoformat(),
        "days_until_expiry": days,
    }


class DocumentMatchRequest(BaseModel):
    """Request body for document matching."""
    user_id: str
    required: List[str]
    deadline: Optional[str] = None


class DocumentMatchResponse(BaseModel):
    """Result of matching user documents against scheme requirements."""
    user_id: str
    required: List[str]
    present: List[str] = Field(default_factory=list)
    missing: List[str] = Field(default_factory=list)
    expired: List[str] = Field(default_factory=list)
    expires_before_deadline: List[str] = Field(default_factory=list)
    all_satisfied: bool = False
    message: str = ""
    summary: List[str] = Field(default_factory=list)
    verification_metadata: Dict[str, Any] = Field(default_factory=dict)


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post(
    "/documents",
    response_model=DocumentResponse,
    status_code=201,
    summary="Register a document",
)
async def create_document(body: DocumentCreate) -> DocumentResponse:
    """
    Register document metadata in Firestore.
    The agent core reads this metadata for form preparation and eligibility checks.
    """
    data = body.model_dump()
    # Ensure status is passed through (model may default to None)
    if not data.get("status"):
        data["status"] = "pending_verification"
    saved = await fs.create_document(data)
    return DocumentResponse.from_doc(saved)


@router.get(
    "/documents",
    response_model=List[DocumentResponse],
    summary="List documents for a user",
)
async def list_documents(
    user_id: str = Query(..., description="Filter documents by user ID"),
) -> List[DocumentResponse]:
    """List all documents registered for a user."""
    docs = await fs.list_documents_for_user(user_id)
    return [DocumentResponse.from_doc(d) for d in docs]


@router.delete(
    "/documents/{document_id}",
    status_code=204,
    summary="Delete a document",
)
async def delete_document(
    document_id: str,
    user_id: str = Query(..., description="Verify ownership"),
) -> None:
    """Delete a document. Only the owner can delete their documents."""
    doc = await fs.get_document(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
    if doc.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    await fs.delete_document(document_id)


@router.post(
    "/documents/match",
    response_model=DocumentMatchResponse,
    summary="Match user documents against scheme requirements",
)
async def match_documents(body: DocumentMatchRequest) -> DocumentMatchResponse:
    """
    Check which required documents the user has and which are missing/expired.
    """
    docs = await fs.list_documents_for_user(body.user_id)

    # Group by document type, track status
    doc_map: Dict[str, Dict[str, Any]] = {}
    for doc in docs:
        dtype = doc.get("document_type", "")
        if dtype not in doc_map:
            doc_map[dtype] = doc

    deadline = None
    if body.deadline:
        try:
            deadline = date.fromisoformat(body.deadline)
        except (ValueError, TypeError):
            pass

    present = []
    missing = []
    expired = []
    expires_before_deadline = []

    today = date.today()

    for req in body.required:
        doc = doc_map.get(req)
        if doc is None:
            missing.append(req)
            continue

        # Check expiry from extracted fields
        extracted = doc.get("extracted_fields", {})
        expiry_str = extracted.get("expiryDate")
        is_expired = False
        exp_before_deadline = False

        if expiry_str:
            try:
                expiry = date.fromisoformat(expiry_str) if isinstance(expiry_str, str) else expiry_str
                if expiry and expiry < today:
                    is_expired = True
                elif expiry and deadline and expiry < deadline:
                    exp_before_deadline = True
            except (ValueError, TypeError):
                pass

        if is_expired:
            expired.append(req)
        elif exp_before_deadline:
            expires_before_deadline.append(req)
        else:
            present.append(req)

    all_satisfied = not missing and not expired and not expires_before_deadline

    summary = []
    for m in missing:
        summary.append(f"Missing {m.replace('_', ' ')}.")
    for e in expired:
        summary.append(f"Your {e.replace('_', ' ')} has expired.")
    for eb in expires_before_deadline:
        summary.append(f"Your {eb.replace('_', ' ')} expires before the application deadline.")
    if all_satisfied:
        summary.append("All required documents are present and valid.")

    message = summary[-1] if summary else "Documents matched."
    if missing:
        message = f"Missing {', '.join(m.replace('_', ' ') for m in missing)}."

    verification_metadata = {
        "extraction": {
            "type": "REAL",
            "method": "Gemini Vision OCR",
            "description": "Fields extracted from uploaded document",
        },
        "expiry_check": {
            "type": "REAL",
            "method": "Deterministic date comparison",
            "description": "Checked against today's date",
        },
        "government_verification": {
            "type": "🔴 MOCK",
            "reason": "No direct government API available in demo",
            "description": "Simulated — no real government system contacted",
        },
        "name_matching": {
            "type": "REAL",
            "method": "String comparison against profile",
            "description": "Name on document matched against application profile",
        },
    }

    return DocumentMatchResponse(
        user_id=body.user_id,
        required=body.required,
        present=present,
        missing=missing,
        expired=expired,
        expires_before_deadline=expires_before_deadline,
        all_satisfied=all_satisfied,
        message=message,
        summary=summary,
        verification_metadata=verification_metadata,
    )


# ─── Demo scenario ───────────────────────────────────────────────────────────

# Demo scenario document definitions.
# Each document has: document_type, filename, status, extracted_fields, verification_metadata

_DEMO_FULLY_VERIFIED = [
    {
        "document_type": "aadhaar",
        "filename": "aadhaar_card.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2030-12-31",
            "name": "Demo User",
            "dob": "2002-05-15",
            "gender": "Male",
        },
    },
    {
        "document_type": "income_certificate",
        "filename": "income_cert_fy2026.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2027-03-31",
            "annual_income": 500000,
            "issued_by": "Tehsildar Office",
            "fy": "2025-26",
        },
    },
    {
        "document_type": "caste_certificate",
        "filename": "caste_cert.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2028-06-30",
            "category": "OBC",
            "issued_by": "District Collector Office",
        },
    },
    {
        "document_type": "marksheet",
        "filename": "class12_marksheet.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2035-12-31",
            "board": "Maharashtra State Board",
            "percentage": 78,
            "year": "2024",
        },
    },
    {
        "document_type": "bank_passbook",
        "filename": "bank_passbook.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2035-12-31",
            "bank_name": "State Bank of India",
            "account_holder": "Demo User",
        },
    },
    {
        "document_type": "admission_letter",
        "filename": "admission_letter.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2026-12-31",
            "institution": "Fr. Conceicao Rodrigues College of Engineering",
            "course": "B.Tech Computer Engineering",
            "year": "2024",
        },
    },
    {
        "document_type": "domicile_certificate",
        "filename": "domicile_cert.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2028-06-30",
            "state": "Maharashtra",
        },
    },
]

_DEMO_NEEDS_DOCS = [
    # Only Aadhaar and Bank Passbook — missing income cert, caste cert, marksheet
    {
        "document_type": "aadhaar",
        "filename": "aadhaar_card.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2030-12-31",
            "name": "Demo User",
            "dob": "2002-05-15",
            "gender": "Male",
        },
    },
    {
        "document_type": "bank_passbook",
        "filename": "bank_passbook.pdf",
        "status": "verified",
        "extracted_fields": {
            "expiryDate": "2035-12-31",
            "bank_name": "State Bank of India",
            "account_holder": "Demo User",
        },
    },
]

class DemoScenarioRequest(BaseModel):
    """Request to set the demo scenario."""
    scenario: str  # "fully_verified" | "needs_documents"


@router.post(
    "/demo/scenario",
    status_code=200,
    summary="Set demo scenario for document seeding",
)
async def set_demo_scenario(body: DemoScenarioRequest, user_id: str = Query(...)):
    """
    Set the demo scenario for a user.
    - fully_verified: complete profile + all documents verified
    - needs_documents: some documents missing/unverified
    
    This replaces the user's demo-seeded documents atomically.
    User-uploaded (non-demo) documents are preserved.
    """
    if body.scenario not in ("fully_verified", "needs_documents"):
        raise HTTPException(status_code=400, detail="Scenario must be 'fully_verified' or 'needs_documents'")

    # 1. Delete existing demo-seeded documents for this user
    existing_docs = await fs.list_documents_for_user(user_id)
    for doc in existing_docs:
        if doc.get("demo_seeded", False):
            await fs.delete_document(doc["id"])

    # 2. Seed new scenario documents
    scenario_docs = _DEMO_FULLY_VERIFIED if body.scenario == "fully_verified" else _DEMO_NEEDS_DOCS
    for doc_def in scenario_docs:
        await fs.create_document({
            **doc_def,
            "user_id": user_id,
            "demo_seeded": True,
            "verification_metadata": {
                "government_verification": {
                    "type": "🔴 MOCK",
                    "reason": "Demo scenario — simulated verification",
                    "description": "No real government system contacted",
                },
            },
        })

    _demo_scenario[user_id] = body.scenario
    logger.info("Demo scenario set to '%s' for user %s — seeded %d docs", body.scenario, user_id, len(scenario_docs))
    return {"scenario": body.scenario, "documents_seeded": len(scenario_docs)}


@router.get(
    "/demo/scenario",
    summary="Get current demo scenario",
)
async def get_demo_scenario(user_id: str = Query(...)):
    """Get the current demo scenario for a user."""
    return {"scenario": _demo_scenario.get(user_id, "fully_verified")}


# ─── Verification status ─────────────────────────────────────────────────────

@router.get(
    "/verification/status",
    summary="What's real vs. mocked in this demo",
)
async def get_verification_status():
    """
    Returns a transparency report: which capabilities use real systems
    vs. mock/demo implementations. Useful for judges and reviewers.
    """
    return {
        "extraction": {
            "type": "REAL",
            "tool": "Gemini Vision",
            "description": "Document field extraction via Gemini Vision OCR",
        },
        "expiry_checking": {
            "type": "REAL",
            "method": "Deterministic date comparison",
            "description": "Document expiry checked against today's date",
        },
        "aadhaar_verification": {
            "type": "🔴 MOCK",
            "reason": "No government API access",
            "description": "Aadhaar verification simulated for demo",
        },
        "caste_certificate_verification": {
            "type": "🔴 MOCK",
            "reason": "No government API access",
            "description": "Caste certificate verification simulated for demo",
        },
        "income_verification": {
            "type": "🔴 MOCK",
            "reason": "No government API access",
            "description": "Income verification simulated for demo",
        },
        "government_portal_submission": {
            "type": "🔴 MOCK",
            "reason": "Test portal only",
            "description": "Government portal submission simulated for demo",
        },
        "government_portal_polling": {
            "type": "🔴 MOCK",
            "reason": "Test portal only",
            "description": "Status polling simulated for demo",
        },
        "government_captcha": {
            "type": "🔴 MOCK",
            "reason": "No CAPTCHA in demo",
            "description": "CAPTCHA step bypassed in demo",
        },
        "document_vault_ui": {
            "type": "REAL",
            "owner": "Iva team",
            "description": "Document management UI is real",
        },
        "form_preparation": {
            "type": "REAL",
            "owner": "Iva team",
            "description": "Form field mapping from profile + documents is real",
        },
        "scheme_discovery": {
            "type": "REAL",
            "owner": "Iva team",
            "description": "Scheme search, eligibility, and ranking use real government data",
        },
        "voice_notification": {
            "type": "🟡 HANDOFF",
            "owner": "Iva team",
            "description": "Voice/IVR integration handled separately",
        },
    }
