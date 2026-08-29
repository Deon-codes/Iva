"""
Document routes — upload metadata, list a user's documents, and check
document match status against a scheme's requirements.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.document import Document, DocumentMatchResult, DocumentStatus, DocumentType
from services import doc_service

router = APIRouter()


class CreateDocumentRequest(BaseModel):
    id: str
    user_id: str
    type: DocumentType
    name: Optional[str] = None
    issue_date: Optional[str] = None   # ISO date, e.g. "2025-04-01"
    expiry_date: Optional[str] = None  # ISO date; omit if it doesn't expire


class DocumentResponse(BaseModel):
    id: str
    user_id: str
    type: DocumentType
    name: Optional[str]
    issue_date: Optional[str]
    expiry_date: Optional[str]
    status: DocumentStatus

    @staticmethod
    def from_document(doc: Document) -> "DocumentResponse":
        return DocumentResponse(
            id=doc.id, user_id=doc.user_id, type=doc.type, name=doc.name,
            issue_date=doc.issue_date, expiry_date=doc.expiry_date, status=doc.status,
        )


class MatchDocumentsRequest(BaseModel):
    user_id: str
    required: list[DocumentType]
    deadline: Optional[str] = None  # ISO date; the scheme's actual deadline, if known


@router.post("/api/documents", response_model=DocumentResponse, status_code=201)
def upload_document(payload: CreateDocumentRequest):
    if doc_service.get_document(payload.user_id, payload.id) is not None:
        raise HTTPException(status_code=409, detail="Document already exists")

    document = Document(
        id=payload.id,
        user_id=payload.user_id,
        type=payload.type,
        name=payload.name,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
    )
    doc_service.create_document(document)
    return DocumentResponse.from_document(document)


@router.get("/api/documents/{user_id}", response_model=list[DocumentResponse])
def list_documents(user_id: str):
    docs = doc_service.get_documents_for_user(user_id)
    return [DocumentResponse.from_document(d) for d in docs]


@router.post("/api/documents/match", response_model=DocumentMatchResult)
def match_documents(payload: MatchDocumentsRequest):
    return doc_service.match_documents(
        user_id=payload.user_id,
        required=payload.required,
        deadline=payload.deadline,
    )