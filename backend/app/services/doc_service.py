"""
Document intelligence service — Person 4 ownership.

Responsibilities (per spec):
  - upload / process documents
  - extract structured fields (Gemini used only where it adds real value —
    NOT for deterministic validation like expiry math)
  - store metadata (in-memory now; Firestore-shaped, swap-in later)
  - match documents against a scheme's required list
  - detect expiry / expiring-soon / missing

This module has zero dependency on your existing application/status code
so it can be dropped in without import conflicts. Wire it up by importing
`doc_service` in routes/doc.py (already done in the companion file).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta
from typing import Optional

from models.document import (
    Document,
    DocumentMatchResult,
    DocumentStatus,
    DocumentType,
    ExpiryCheckResult,
)

# ---------------------------------------------------------------------------
# In-memory store. Shape matches what a Firestore collection ("documents")
# would look like keyed by document id, so migration later is a find/replace
# of get/set calls, not a data-model rewrite.
# ---------------------------------------------------------------------------
_documents: dict[str, Document] = {}


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------
def extract_document_fields(
    doc_type: DocumentType, raw_metadata: dict
) -> dict:
    """
    Extract structured fields from a document.

    For the hackathon demo, documents are synthetic: the caller supplies
    the "extracted" fields directly (simulating OCR/Gemini output) via
    raw_metadata. This function is the single seam where a real Gemini
    call would go for free-text interpretation (e.g. reading a scanned
    certificate). It intentionally does NOT do deterministic validation
    (date math, matching) — that stays in plain Python below, per spec:
    "Do not use Gemini for simple deterministic validation."

    Args:
        doc_type: the declared document type
        raw_metadata: caller-supplied mock fields, e.g.
            {"name": "Asha Patel", "issueDate": "2024-01-10",
             "expiryDate": "2025-01-10"}

    Returns:
        dict of extracted fields (name, issueDate, expiryDate, etc.)
    """
    # --- Gemini interpretation hook (left as explicit TODO) -----------------
    # If raw_metadata contains a free-text blob instead of structured fields
    # (e.g. {"raw_text": "..."}), this is where you'd call Gemini to pull
    # out name/issueDate/expiryDate. Example shape:
    #
    #   if "raw_text" in raw_metadata:
    #       extracted = call_gemini_extract(doc_type, raw_metadata["raw_text"])
    #       return extracted
    #
    # For the demo we accept pre-structured synthetic fields directly so the
    # pipeline is deterministic and testable without burning API calls.
    # -------------------------------------------------------------------------
    extracted = {
        "name": raw_metadata.get("name"),
        "issueDate": raw_metadata.get("issueDate"),
        "expiryDate": raw_metadata.get("expiryDate"),
    }
    # merge through any extra scheme-specific fields (e.g. income amount)
    for k, v in raw_metadata.items():
        if k not in extracted:
            extracted[k] = v
    return extracted


def _parse_date(value) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, date):
        return value
    return datetime.strptime(value, "%Y-%m-%d").date()


def _compute_status(expiry: Optional[date]) -> DocumentStatus:
    if expiry is None:
        return DocumentStatus.VALID
    if expiry < date.today():
        return DocumentStatus.EXPIRED
    return DocumentStatus.VALID


# ---------------------------------------------------------------------------
# Upload / processing
# ---------------------------------------------------------------------------
def upload_document(
    user_id: str,
    doc_type: DocumentType,
    raw_metadata: dict,
    source_filename: Optional[str] = None,
) -> Document:
    """
    Process an uploaded (synthetic/mock) document and store its metadata.
    Does NOT persist raw file bytes — only extracted structured metadata,
    per spec ("do not unnecessarily store raw sensitive documents").
    """
    extracted = extract_document_fields(doc_type, raw_metadata)

    issue_date = _parse_date(extracted.get("issueDate"))
    expiry_date = _parse_date(extracted.get("expiryDate"))

    doc = Document(
        id=f"doc_{uuid.uuid4().hex[:8]}",
        userId=user_id,
        type=doc_type,
        name=extracted.get("name"),
        issueDate=issue_date,
        expiryDate=expiry_date,
        status=_compute_status(expiry_date),
        extractedFields=extracted,
        sourceFilename=source_filename,
    )
    _documents[doc.id] = doc
    return doc


def get_document(doc_id: str) -> Optional[Document]:
    return _documents.get(doc_id)


def get_user_documents(user_id: str) -> list[Document]:
    return [d for d in _documents.values() if d.userId == user_id]


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------
def match_documents(user_id: str, required: list[str]) -> DocumentMatchResult:
    """
    Given a scheme's required document types, determine which the user has
    already uploaded (valid, not expired) and which are missing.
    """
    user_docs = get_user_documents(user_id)
    have_types = {
        d.type for d in user_docs if d.status != DocumentStatus.EXPIRED
    }

    matched = [r for r in required if r in have_types]
    missing = [r for r in required if r not in have_types]

    if missing:
        readable = ", ".join(m.replace("_", " ") for m in missing)
        message = f"Missing {readable}."
    else:
        message = "All required documents are present."

    return DocumentMatchResult(
        userId=user_id,
        required=required,
        matched=matched,
        missing=missing,
        all_satisfied=len(missing) == 0,
        message=message,
    )


# ---------------------------------------------------------------------------
# Expiry awareness
# ---------------------------------------------------------------------------
def check_expiry(
    doc_id: str, deadline: Optional[date] = None, warn_within_days: int = 30
) -> ExpiryCheckResult:
    """
    Check whether a document is expired, or will expire before a given
    deadline (e.g. an application deadline). Never invents an expiry period —
    uses only the document's own stored expiryDate.
    """
    doc = get_document(doc_id)
    if doc is None:
        raise ValueError(f"Unknown document id: {doc_id}")

    expiry = doc.expiryDate
    is_expired = expiry is not None and expiry < date.today()
    expires_before_deadline = (
        expiry is not None and deadline is not None and expiry < deadline
    )

    if is_expired:
        message = f"Your {doc.type.replace('_', ' ')} has expired."
    elif expires_before_deadline:
        message = (
            f"Your {doc.type.replace('_', ' ')} expires before the "
            f"application deadline ({deadline.isoformat()})."
        )
    elif expiry is not None and expiry - date.today() <= timedelta(
        days=warn_within_days
    ):
        message = (
            f"Your {doc.type.replace('_', ' ')} expires soon "
            f"({expiry.isoformat()})."
        )
    else:
        message = f"Your {doc.type.replace('_', ' ')} is valid."

    # keep stored status in sync
    if is_expired:
        doc.status = DocumentStatus.EXPIRED
    elif expires_before_deadline:
        doc.status = DocumentStatus.EXPIRING_SOON

    return ExpiryCheckResult(
        documentId=doc.id,
        documentType=doc.type,
        expiryDate=expiry,
        deadline=deadline,
        is_expired=is_expired,
        expires_before_deadline=expires_before_deadline,
        message=message,
    )


# ---------------------------------------------------------------------------
# Test/dev helper — NOT for production use
# ---------------------------------------------------------------------------
def _reset_store_for_tests() -> None:
    _documents.clear()