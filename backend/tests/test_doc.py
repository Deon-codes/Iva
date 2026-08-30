"""
Integration tests for document intelligence — Person 4 ownership.

Covers, per the Definition of Done:
  - document upload works
  - metadata stored
  - document matching works (present + missing)
  - expiry warning works (expired, expiring-before-deadline, valid)

Run with:  pytest tests/test_documents_integration.py -v

Note: these test the document subsystem in isolation. Once your
application-state-machine / status-agent modules are confirmed at stable
paths, add a second suite that chains upload -> match -> application
submission -> background status check, per the full end-to-end diagram
in the spec. This file intentionally avoids importing those modules so it
runs standalone without path guessing.
"""

from datetime import date, timedelta

import pytest

from models.document import DocumentStatus, DocumentType
from app.services import doc_service


@pytest.fixture(autouse=True)
def reset_store():
    doc_service._reset_store_for_tests()
    yield
    doc_service._reset_store_for_tests()


def _iso(d: date) -> str:
    return d.isoformat()


# ---------------------------------------------------------------------------
# Upload / metadata storage
# ---------------------------------------------------------------------------
def test_upload_document_stores_metadata():
    today = date.today()
    doc = doc_service.upload_document(
        user_id="user_001",
        doc_type=DocumentType.INCOME_CERTIFICATE,
        raw_metadata={
            "name": "Asha Patel",
            "issueDate": _iso(today - timedelta(days=30)),
            "expiryDate": _iso(today + timedelta(days=300)),
        },
    )
    assert doc.id.startswith("doc_")
    assert doc.userId == "user_001"
    assert doc.type == DocumentType.INCOME_CERTIFICATE.value
    assert doc.name == "Asha Patel"
    assert doc.status == DocumentStatus.VALID.value

    fetched = doc_service.get_document(doc.id)
    assert fetched is not None
    assert fetched.id == doc.id


def test_upload_without_dates_defaults_valid():
    doc = doc_service.upload_document(
        user_id="user_001",
        doc_type=DocumentType.MARKSHEET,
        raw_metadata={"name": "Asha Patel"},
    )
    assert doc.expiryDate is None
    assert doc.status == DocumentStatus.VALID.value


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------
def test_matching_all_present():
    for t in [DocumentType.INCOME_CERTIFICATE, DocumentType.MARKSHEET, DocumentType.CASTE_CERTIFICATE]:
        doc_service.upload_document("user_002", t, {"name": "X"})

    result = doc_service.match_documents(
        "user_002",
        ["income_certificate", "marksheet", "caste_certificate"],
    )
    assert result.all_satisfied is True
    assert result.missing == []
    assert set(result.matched) == {
        "income_certificate",
        "marksheet",
        "caste_certificate",
    }


def test_matching_missing_document():
    doc_service.upload_document("user_003", DocumentType.INCOME_CERTIFICATE, {"name": "X"})
    doc_service.upload_document("user_003", DocumentType.MARKSHEET, {"name": "X"})
    # caste_certificate intentionally not uploaded

    result = doc_service.match_documents(
        "user_003",
        ["income_certificate", "marksheet", "caste_certificate"],
    )
    assert result.all_satisfied is False
    assert result.missing == ["caste_certificate"]
    assert result.message == "Missing caste certificate."


def test_matching_ignores_no_documents_for_unknown_user():
    result = doc_service.match_documents("ghost_user", ["income_certificate"])
    assert result.missing == ["income_certificate"]
    assert result.all_satisfied is False


# ---------------------------------------------------------------------------
# Expiry awareness
# ---------------------------------------------------------------------------
def test_expired_document_detected():
    today = date.today()
    doc = doc_service.upload_document(
        "user_004",
        DocumentType.INCOME_CERTIFICATE,
        {
            "issueDate": _iso(today - timedelta(days=400)),
            "expiryDate": _iso(today - timedelta(days=5)),
        },
    )
    # upload_document already computes status
    assert doc.status == DocumentStatus.EXPIRED.value

    result = doc_service.check_expiry(doc.id)
    assert result.is_expired is True
    assert "expired" in result.message.lower()


def test_document_expires_before_deadline():
    today = date.today()
    doc = doc_service.upload_document(
        "user_005",
        DocumentType.INCOME_CERTIFICATE,
        {
            "issueDate": _iso(today - timedelta(days=100)),
            "expiryDate": _iso(today + timedelta(days=10)),
        },
    )
    deadline = today + timedelta(days=20)
    result = doc_service.check_expiry(doc.id, deadline=deadline)

    assert result.is_expired is False
    assert result.expires_before_deadline is True
    assert "before the application deadline" in result.message


def test_document_valid_and_not_expiring_soon():
    today = date.today()
    doc = doc_service.upload_document(
        "user_006",
        DocumentType.MARKSHEET,
        {
            "issueDate": _iso(today - timedelta(days=10)),
            "expiryDate": _iso(today + timedelta(days=500)),
        },
    )
    result = doc_service.check_expiry(doc.id)
    assert result.is_expired is False
    assert result.expires_before_deadline is False
    assert "valid" in result.message.lower()


def test_check_expiry_unknown_document_raises():
    with pytest.raises(ValueError):
        doc_service.check_expiry("doc_does_not_exist")


# ---------------------------------------------------------------------------
# Matching after expiry — an expired doc should NOT count as "present"
# ---------------------------------------------------------------------------
def test_expired_document_counts_as_missing_in_matching():
    today = date.today()
    doc_service.upload_document(
        "user_007",
        DocumentType.INCOME_CERTIFICATE,
        {"expiryDate": _iso(today - timedelta(days=1))},
    )
    result = doc_service.match_documents("user_007", ["income_certificate"])
    assert result.all_satisfied is False
    assert "income_certificate" in result.missing


# ---------------------------------------------------------------------------
# Verification metadata — transparency labels for real vs. mock
# ---------------------------------------------------------------------------
def test_match_documents_includes_verification_metadata():
    doc_service.upload_document("user_008", DocumentType.INCOME_CERTIFICATE, {"name": "X"})
    doc_service.upload_document("user_008", DocumentType.CASTE_CERTIFICATE, {"name": "X"})

    result = doc_service.match_documents(
        "user_008",
        ["income_certificate", "caste_certificate"],
    )
    assert "verification_metadata" in dir(result) or hasattr(result, "verification_metadata")
    meta = result.verification_metadata
    assert meta["government_verification"]["type"] == "🔴 MOCK"
    assert meta["extraction"]["type"] == "REAL"
    assert meta["expiry_check"]["type"] == "REAL"
    assert meta["name_matching"]["type"] == "REAL"


def test_match_documents_summary_includes_verification_labels():
    doc_service.upload_document("user_009", DocumentType.INCOME_CERTIFICATE, {"name": "X"})

    result = doc_service.match_documents(
        "user_009",
        ["income_certificate"],
    )
    summary_text = " ".join(result.summary)
    assert "[REAL]" in summary_text
    assert "[🔴 DEMO]" in summary_text


def test_match_documents_with_missing_includes_labels():
    result = doc_service.match_documents("user_010", ["income_certificate"])
    summary_text = " ".join(result.summary)
    assert "[REAL]" in summary_text
    assert "[🔴 DEMO]" in summary_text
    assert "Missing" in summary_text