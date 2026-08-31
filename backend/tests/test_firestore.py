"""
Tests for Firestore service (in-memory stub).
Covers: user CRUD, scheme operations, application lifecycle, document operations.
"""

from __future__ import annotations

import pytest
import pytest_asyncio


@pytest.mark.asyncio
async def test_upsert_and_get_user(sample_user):
    from app.services.firestore_service import upsert_user, get_user

    await upsert_user(sample_user["id"], sample_user)
    retrieved = await get_user(sample_user["id"])

    assert retrieved is not None
    assert retrieved["name"] == "Priya Sharma"
    assert retrieved["state"] == "Maharashtra"


@pytest.mark.asyncio
async def test_get_user_not_found():
    from app.services.firestore_service import get_user

    result = await get_user("nonexistent_user_999")
    assert result is None


@pytest.mark.asyncio
async def test_create_and_get_application(sample_user):
    from app.services.firestore_service import create_application, get_application

    app = await create_application(sample_user["id"], "scheme_aicte_pragati")

    assert app["userId"] == sample_user["id"]
    assert app["schemeId"] == "scheme_aicte_pragati"
    assert app["status"] == "draft"
    assert app["submittedAt"] is None
    assert app["rejectionReason"] is None

    retrieved = await get_application(app["id"])
    assert retrieved is not None
    assert retrieved["id"] == app["id"]


@pytest.mark.asyncio
async def test_application_status_update(sample_user):
    from app.services.firestore_service import create_application, update_application_status, get_application

    app = await create_application(sample_user["id"], "scheme_pm_nsp_merit")
    app_id = app["id"]

    updated = await update_application_status(
        app_id, "submitted", next_action="Awaiting document verification"
    )
    assert updated["status"] == "submitted"
    assert updated["nextAction"] == "Awaiting document verification"

    # Further transition
    await update_application_status(app_id, "action_required", next_action="Upload income certificate")
    final = await get_application(app_id)
    assert final["status"] == "action_required"
    assert final["nextAction"] == "Upload income certificate"


@pytest.mark.asyncio
async def test_list_applications_for_user(sample_user):
    from app.services.firestore_service import create_application, list_applications_for_user

    await create_application(sample_user["id"], "scheme_aicte_pragati")
    await create_application(sample_user["id"], "scheme_maha_rajarshi_shahu")

    apps = await list_applications_for_user(sample_user["id"])
    assert len(apps) == 2
    assert all(a["userId"] == sample_user["id"] for a in apps)


@pytest.mark.asyncio
async def test_append_application_event(sample_user):
    from app.services.firestore_service import create_application, append_application_event

    app = await create_application(sample_user["id"], "scheme_pm_nsp_merit")

    event = await append_application_event(
        app["id"],
        event_type="status_change",
        message="Application created",
        triggered_by=sample_user["id"],
    )
    assert event["event_type"] == "status_change"
    assert event["application_id"] == app["id"]


@pytest.mark.asyncio
async def test_create_and_get_document(sample_user):
    from app.services.firestore_service import create_document, get_document

    doc_data = {
        "user_id": sample_user["id"],
        "document_type": "income_certificate",
        "filename": "income_cert.pdf",
        "storage_url": "gs://iva-test/income_cert.pdf",
        "status": "pending_verification",
    }
    doc = await create_document(doc_data)
    assert doc["document_type"] == "income_certificate"

    retrieved = await get_document(doc["id"])
    assert retrieved is not None
    assert retrieved["filename"] == "income_cert.pdf"
