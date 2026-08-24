"""
POST /api/documents · GET /api/documents
Document metadata endpoints for Person 4 (feature/status-documents).

Person 4's OCR/document vault system calls these endpoints to register documents.
The agent core reads document metadata for form preparation.
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException, Query

from app.models.document import Document, DocumentCreate
from app.services import firestore_service as fs

router = APIRouter(prefix="/api", tags=["documents"])
logger = logging.getLogger(__name__)


@router.post(
    "/documents",
    response_model=Document,
    status_code=201,
    summary="Register a document (Person 4 integration)",
)
async def create_document(body: DocumentCreate) -> Document:
    """
    Register document metadata in Firestore.
    Called by Person 4's document vault after uploading a file to GCS.
    The Form-Prep Agent reads this metadata to check document availability.
    """
    data = body.model_dump()
    saved = await fs.create_document(data)
    return Document(**saved)


@router.get(
    "/documents",
    response_model=List[Document],
    summary="List documents for a user (Person 4 integration)",
)
async def list_documents(
    user_id: str = Query(..., description="Filter documents by user ID"),
) -> List[Document]:
    """List all documents registered for a user."""
    docs = await fs.list_documents_for_user(user_id)
    return [Document(**d) for d in docs]
