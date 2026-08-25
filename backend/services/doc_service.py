"""
Document Intelligence service.

Owns: storing document metadata, matching a user's documents against a
scheme's required list, and expiry detection. Deliberately no Gemini
calls in here — matching/expiry are deterministic per spec. Gemini
belongs in document *interpretation* (e.g. extracting fields from a
messy upload), which is a separate, later concern from matching.
"""

from __future__ import annotations

from typing import Optional

from models.document import Document, DocumentMatchResult, DocumentStatus, DocumentType

# user_id -> list of documents. Swap for Firestore reads/writes later
# without changing any function signature below.
_DOCUMENTS: dict[str, list[Document]] = {}


def create_document(document: Document) -> Document:
    """Store a document's metadata (not the raw file — per spec, avoid
    storing unnecessary sensitive data). Computes status on the way in."""
    document.status = document.compute_status()
    _DOCUMENTS.setdefault(document.user_id, []).append(document)
    return document


def get_documents_for_user(user_id: str) -> list[Document]:
    return list(_DOCUMENTS.get(user_id, []))


def get_document(user_id: str, document_id: str) -> Optional[Document]:
    for doc in _DOCUMENTS.get(user_id, []):
        if doc.id == document_id:
            return doc
    return None


def refresh_statuses(user_id: str, deadline: Optional[str] = None) -> list[Document]:
    """Recompute status for every document a user has, e.g. against a
    specific scheme's deadline. Call before matching if the deadline
    might have changed since the documents were uploaded."""
    docs = _DOCUMENTS.get(user_id, [])
    for doc in docs:
        doc.status = doc.compute_status(deadline=deadline)
    return docs


def match_documents(
    user_id: str,
    required: list[DocumentType],
    deadline: Optional[str] = None,
) -> DocumentMatchResult:
    """
    Given a scheme's required document types, determine what the user
    has, what's missing, and what's expired or will expire before the
    deadline. This is the ✓/✗ matching described in the spec.
    """
    docs = refresh_statuses(user_id, deadline=deadline)
    present_types = {doc.type for doc in docs}

    present = [t for t in required if t in present_types]
    missing = [t for t in required if t not in present_types]

    expired = [
        doc.type for doc in docs
        if doc.type in required and doc.status == DocumentStatus.EXPIRED
    ]
    expires_before_deadline = [
        doc.type for doc in docs
        if doc.type in required and doc.status == DocumentStatus.EXPIRES_BEFORE_DEADLINE
    ]

    summary: list[str] = []
    for t in missing:
        summary.append(f"Missing {_label(t)}.")
    for t in expired:
        summary.append(f"Your {_label(t)} has expired.")
    for t in expires_before_deadline:
        summary.append(f"Your {_label(t)} expires before the application deadline.")
    if not summary:
        summary.append("All required documents are present and valid.")

    return DocumentMatchResult(
        required=required,
        present=present,
        missing=missing,
        expired=expired,
        expires_before_deadline=expires_before_deadline,
        summary=summary,
    )


def _label(document_type: DocumentType) -> str:
    return document_type.value.replace("_", " ")