"""
Document metadata model — Person 4 (Documents / Async Status) ownership.

Mirrors the schema in the spec:
{
  "id": "...",
  "userId": "...",
  "type": "income_certificate",
  "issueDate": "...",
  "expiryDate": "...",
  "status": "valid"
}

Storage: in-memory for now (see services/doc_service.py). When migrating to
Firestore, this model's .dict() output maps 1:1 onto a Firestore document —
no field renaming needed.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    INCOME_CERTIFICATE = "income_certificate"
    CASTE_CERTIFICATE = "caste_certificate"
    MARKSHEET = "marksheet"
    AADHAAR_PLACEHOLDER = "aadhaar_placeholder"
    OTHER = "other"


class DocumentStatus(str, Enum):
    VALID = "valid"
    EXPIRING_SOON = "expiring_soon"  # valid today, but expires before a known deadline
    EXPIRED = "expired"
    INVALID = "invalid"  # failed extraction / unparseable / missing required fields


class Document(BaseModel):
    id: str
    userId: str
    type: DocumentType
    name: Optional[str] = None  # name printed on the document, if extracted
    issueDate: Optional[date] = None
    expiryDate: Optional[date] = None
    status: DocumentStatus = DocumentStatus.VALID
    extractedFields: dict = Field(default_factory=dict)
    sourceFilename: Optional[str] = None
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


class DocumentMatchResult(BaseModel):
    userId: str
    required: list[str]
    matched: list[str]
    missing: list[str]
    all_satisfied: bool
    message: str


class ExpiryCheckResult(BaseModel):
    documentId: str
    documentType: str
    expiryDate: Optional[date]
    deadline: Optional[date]
    is_expired: bool
    expires_before_deadline: bool
    message: str