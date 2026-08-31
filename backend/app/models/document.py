"""
Pydantic models for Document data.
Person 4 (feature/status-documents) creates documents via POST /api/documents.
The agent core reads document metadata for form preparation.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class DocumentStatus(str, Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Document(BaseModel):
    """Firestore documents/{documentId} document shape."""

    id: str
    user_id: str
    application_id: Optional[str] = None
    document_type: str     # e.g. "income_certificate", "aadhaar", "marksheet"
    filename: str
    storage_url: str       # GCS path — set by Person 4
    status: DocumentStatus = DocumentStatus.PENDING_VERIFICATION
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)   # set by OCR agent (Person 4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentCreate(BaseModel):
    """Request body for POST /api/documents (Person 4 calls this)."""

    user_id: str
    application_id: Optional[str] = None
    document_type: str
    filename: str
    storage_url: str = ""
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    status: Optional[str] = None  # "verified", "pending_verification", etc.
    demo_seeded: bool = False  # True for demo-scenario-managed documents


class DocumentMetaSummary(BaseModel):
    """Lightweight projection for the Form-Prep Agent to read."""

    id: str
    document_type: str
    filename: str
    status: DocumentStatus
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
