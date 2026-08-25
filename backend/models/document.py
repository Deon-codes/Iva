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
from typing import Optional


class DocumentType(str, Enum):
    INCOME_CERTIFICATE = "income_certificate"
    CASTE_CERTIFICATE = "caste_certificate"
    MARKSHEET = "marksheet"
    OTHER = "other"


class DocumentStatus(str, Enum):
    VALID = "valid"
    EXPIRED = "expired"                    # already past expiry_date as of today
    EXPIRES_BEFORE_DEADLINE = "expires_before_deadline"  # not expired yet, but will be before a given scheme deadline


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    return datetime.fromisoformat(value).date()


@dataclass
class Document:
    id: str
    user_id: str
    type: DocumentType
    name: Optional[str] = None
    issue_date: Optional[str] = None   # ISO date string, e.g. "2025-04-01"
    expiry_date: Optional[str] = None  # ISO date string; None = does not expire
    status: DocumentStatus = DocumentStatus.VALID

    def compute_status(self, deadline: Optional[str] = None, today: Optional[date] = None) -> DocumentStatus:
        """
        Deterministic status computation — never invents an expiry period.
        Only uses expiry_date actually present on the document and the
        deadline actually passed in by the caller (a real scheme deadline).
        """
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
    required: list[DocumentType]
    present: list[DocumentType]
    missing: list[DocumentType]
    expired: list[DocumentType]
    expires_before_deadline: list[DocumentType]
    summary: list[str] = field(default_factory=list)

    @property
    def is_complete(self) -> bool:
        """True only if every required document is present AND none are expired."""
        return not self.missing and not self.expired