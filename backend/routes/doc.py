"""
Document routes — Person 4 ownership.

Mount in your main app with:
    from routes.doc import router as doc_router
    app.include_router(doc_router)
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.document import Document, DocumentMatchResult, DocumentType, ExpiryCheckResult
from services import doc_service

router = APIRouter(prefix="/documents", tags=["documents"])


class UploadDocumentRequest(BaseModel):
    userId: str
    type: DocumentType
    # Synthetic/mock "extracted" fields — simulates what OCR/Gemini would
    # produce, so the demo doesn't depend on real file parsing.
    name: Optional[str] = None
    issueDate: Optional[str] = None  # "YYYY-MM-DD"
    expiryDate: Optional[str] = None  # "YYYY-MM-DD"
    extraFields: dict = {}
    sourceFilename: Optional[str] = None


class MatchDocumentsRequest(BaseModel):
    userId: str
    required: list[str]


@router.post("/upload", response_model=Document)
def upload_document(payload: UploadDocumentRequest):
    raw_metadata = {
        "name": payload.name,
        "issueDate": payload.issueDate,
        "expiryDate": payload.expiryDate,
        **payload.extraFields,
    }
    doc = doc_service.upload_document(
        user_id=payload.userId,
        doc_type=payload.type,
        raw_metadata=raw_metadata,
        source_filename=payload.sourceFilename,
    )
    return doc


@router.get("/{user_id}", response_model=list[Document])
def list_user_documents(user_id: str):
    return doc_service.get_user_documents(user_id)


@router.post("/match", response_model=DocumentMatchResult)
def match_documents(payload: MatchDocumentsRequest):
    return doc_service.match_documents(payload.userId, payload.required)


@router.get("/{doc_id}/expiry-check", response_model=ExpiryCheckResult)
def expiry_check(doc_id: str, deadline: Optional[date] = None):
    try:
        return doc_service.check_expiry(doc_id, deadline=deadline)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))