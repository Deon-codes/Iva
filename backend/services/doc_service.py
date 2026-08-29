"""
Document Intelligence service.

Storage routes through Firestore (collection "documents") when
USE_FIRESTORE=true, otherwise falls back to the same in-memory dict as
before — matching/expiry logic is unchanged either way.
"""

from __future__ import annotations

from typing import Optional

from models.document import Document, DocumentMatchResult, DocumentStatus, DocumentType
from services.firestore_client import firestore_enabled, get_client

_DOCUMENTS: dict[str, list[Document]] = {}  # in-memory fallback: user_id -> docs

_COLLECTION = "documents"


def _to_dict(document: Document) -> dict:
    return {
        "id": document.id,
        "user_id": document.user_id,
        "type": document.type.value,
        "name": document.name,
        "issue_date": document.issue_date,
        "expiry_date": document.expiry_date,
        "status": document.status.value,
    }


def _from_dict(data: dict) -> Document:
    return Document(
        id=data["id"],
        user_id=data["user_id"],
        type=DocumentType(data["type"]),
        name=data.get("name"),
        issue_date=data.get("issue_date"),
        expiry_date=data.get("expiry_date"),
        status=DocumentStatus(data.get("status", "valid")),
    )


def create_document(document: Document) -> Document:
    document.status = document.compute_status()
    if firestore_enabled():
        get_client().collection(_COLLECTION).document(document.id).set(_to_dict(document))
    else:
        _DOCUMENTS.setdefault(document.user_id, []).append(document)
    return document


def get_documents_for_user(user_id: str) -> list[Document]:
    if firestore_enabled():
        query = get_client().collection(_COLLECTION).where("user_id", "==", user_id)
        return [_from_dict(snap.to_dict()) for snap in query.stream()]
    return list(_DOCUMENTS.get(user_id, []))


def get_document(user_id: str, document_id: str) -> Optional[Document]:
    if firestore_enabled():
        snap = get_client().collection(_COLLECTION).document(document_id).get()
        if not snap.exists:
            return None
        data = snap.to_dict()
        return _from_dict(data) if data.get("user_id") == user_id else None

    for doc in _DOCUMENTS.get(user_id, []):
        if doc.id == document_id:
            return doc
    return None


def refresh_statuses(user_id: str, deadline: Optional[str] = None) -> list[Document]:
    docs = get_documents_for_user(user_id)
    for doc in docs:
        doc.status = doc.compute_status(deadline=deadline)
        if firestore_enabled():
            get_client().collection(_COLLECTION).document(doc.id).update(
                {"status": doc.status.value}
            )
    return docs


def match_documents(
    user_id: str,
    required: list[DocumentType],
    deadline: Optional[str] = None,
) -> DocumentMatchResult:
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
        required=required, present=present, missing=missing,
        expired=expired, expires_before_deadline=expires_before_deadline, summary=summary,
    )


def _label(document_type: DocumentType) -> str:
    return document_type.value.replace("_", " ")


# ---------------------------------------------------------------------------
# Test helper — clears the in-memory store between tests
# ---------------------------------------------------------------------------
def _reset_store_for_tests() -> None:
    global _DOCUMENTS
    _DOCUMENTS.clear()