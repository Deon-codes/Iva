"""
Document models for the Document Intelligence half of this role.

Kept deterministic and dependency-free on purpose: matching and expiry
checks are pure date/string comparisons, not Gemini calls (per spec:
"Do not use Gemini for simple deterministic validation").
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Optional


class DocumentType(str, Enum):
    INCOME_CERTIFICATE = "income_certificate"
    CASTE_CERTIFICATE = "caste_certificate"
    MARKSHEET = "marksheet"
    OTHER = "other"


class VerificationStatus(str, Enum):
    """Labels whether a check is real, mocked, or a handoff."""
    EXTRACTED = "extracted"               # REAL: OCR/Gemini extracted fields
    DEMO_VERIFIED = "demo_verified"       # 🔴 MOCK: Simulated government verification
    NOT_VERIFIED = "not_verified"         # 🟡 Handoff: User will verify manually
    GOVERNMENT_VERIFIED = "government_verified"  # Future: Real gov API


class DocumentStatus(str, Enum):
    VALID = "valid"
    EXPIRED = "expired"
    EXPIRES_BEFORE_DEADLINE = "expires_before_deadline"
    EXPIRING_SOON = "expiring_soon"


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    return datetime.fromisoformat(value).date()


@dataclass
class Document:
    id: str
    type: DocumentType
    user_id: str = ""
    name: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    status: DocumentStatus = DocumentStatus.VALID
    # camelCase fields used by app.services.doc_service
    userId: Optional[str] = None
    issueDate: Optional[date] = None
    expiryDate: Optional[date] = None
    extractedFields: Dict[str, Any] = field(default_factory=dict)
    sourceFilename: Optional[str] = None

    def __post_init__(self):
        if self.userId is None:
            self.userId = self.user_id
        elif not self.user_id:
            self.user_id = self.userId

    def compute_status(self, deadline: Optional[str] = None, today: Optional[date] = None) -> DocumentStatus:
        today = today or date.today()
        expiry = _parse_date(self.expiry_date)
        if expiry is None:
            return DocumentStatus.VALID
        if expiry < today:
            return DocumentStatus.EXPIRED
        deadline_date = _parse_date(deadline)
        if deadline_date is not None and expiry < deadline_date:
            return DocumentStatus.EXPIRES_BEFORE_DEADLINE
        return DocumentStatus.VALID


@dataclass
class DocumentMatchResult:
    required: list
    present: list = field(default_factory=list)
    missing: list = field(default_factory=list)
    expired: list = field(default_factory=list)
    expires_before_deadline: list = field(default_factory=list)
    summary: list[str] = field(default_factory=list)
    verification_metadata: dict = field(default_factory=dict)
    userId: Optional[str] = None
    matched: list = field(default_factory=list)
    all_satisfied: bool = False
    message: str = ""

    @property
    def is_complete(self) -> bool:
        return not self.missing and not self.expired


@dataclass
class ExpiryCheckResult:
    documentId: str = ""
    documentType: Any = None
    expiryDate: Optional[date] = None
    deadline: Optional[date] = None
    is_expired: bool = False
    expires_before_deadline: bool = False
    message: str = ""
