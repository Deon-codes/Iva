"""
API integration tests using FastAPI TestClient.
All run in mock mode — no real GCP or Gemini calls.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────

def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "environment" in data
    assert "gemini_enabled" in data


# ─────────────────────────────────────────────────────────────────────────────
# Schemes
# ─────────────────────────────────────────────────────────────────────────────

def test_list_schemes(client):
    resp = client.get("/api/schemes")
    assert resp.status_code == 200
    schemes = resp.json()
    assert len(schemes) == 3
    ids = [s["id"] for s in schemes]
    assert "scheme_aicte_pragati" in ids
    assert "scheme_maha_rajarshi_shahu" in ids
    assert "scheme_pm_nsp_merit" in ids


def test_get_scheme_detail(client):
    resp = client.get("/api/schemes/scheme_aicte_pragati")
    assert resp.status_code == 200
    scheme = resp.json()
    assert scheme["name"] == "AICTE Pragati Scholarship for Girl Students (Technical Degree/Diploma)"
    assert "required_documents" in scheme
    assert "official_url" in scheme


def test_get_scheme_not_found(client):
    resp = client.get("/api/schemes/scheme_does_not_exist")
    assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Profile
# ─────────────────────────────────────────────────────────────────────────────

def test_create_and_get_profile(client, sample_user):
    # Create
    payload = {
        "user_id": sample_user["id"],
        "name": sample_user["name"],
        "email": sample_user["email"],
        "state": sample_user["state"],
        "age": sample_user["age"],
        "annual_income_inr": sample_user["annual_income_inr"],
        "education_level": sample_user["education_level"],
        "caste_category": sample_user["caste_category"],
        "gender": sample_user["gender"],
        "institution_name": sample_user["institution_name"],
        "course_name": sample_user["course_name"],
    }
    resp = client.post("/api/profile", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Priya Sharma"
    assert data["state"] == "Maharashtra"

    # Read back
    resp2 = client.get(f"/api/profile?user_id={sample_user['id']}")
    assert resp2.status_code == 200
    assert resp2.json()["email"] == sample_user["email"]


def test_get_profile_not_found(client):
    resp = client.get("/api/profile?user_id=no_such_user_999")
    assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Applications
# ─────────────────────────────────────────────────────────────────────────────

def test_create_application(client, sample_user):
    resp = client.post("/api/applications", json={
        "user_id": sample_user["id"],
        "scheme_id": "scheme_aicte_pragati",
    })
    assert resp.status_code == 201
    app = resp.json()
    # Shared contract shape
    assert "id" in app
    assert app["userId"] == sample_user["id"]
    assert app["schemeId"] == "scheme_aicte_pragati"
    assert app["status"] == "draft"
    assert app["submittedAt"] is None
    assert app["rejectionReason"] is None


def test_get_application(client, sample_user):
    # Create first
    create_resp = client.post("/api/applications", json={
        "user_id": sample_user["id"],
        "scheme_id": "scheme_pm_nsp_merit",
    })
    app_id = create_resp.json()["id"]

    # Retrieve
    resp = client.get(f"/api/applications/{app_id}")
    assert resp.status_code == 200
    app = resp.json()
    assert app["id"] == app_id
    assert app["status"] == "draft"


def test_list_applications(client, sample_user):
    # Create two applications
    client.post("/api/applications", json={"user_id": sample_user["id"], "scheme_id": "scheme_aicte_pragati"})
    client.post("/api/applications", json={"user_id": sample_user["id"], "scheme_id": "scheme_pm_nsp_merit"})

    resp = client.get(f"/api/applications?user_id={sample_user['id']}")
    assert resp.status_code == 200
    apps = resp.json()
    assert len(apps) == 2


def test_get_application_not_found(client):
    resp = client.get("/api/applications/app_does_not_exist")
    assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Documents
# ─────────────────────────────────────────────────────────────────────────────

def test_create_document(client, sample_user):
    resp = client.post("/api/documents", json={
        "user_id": sample_user["id"],
        "document_type": "income_certificate",
        "filename": "income_cert.pdf",
        "storage_url": "gs://hazela-test/income_cert.pdf",
    })
    assert resp.status_code == 201
    doc = resp.json()
    assert doc["document_type"] == "income_certificate"
    assert doc["status"] == "pending_verification"


def test_list_documents(client, sample_user):
    client.post("/api/documents", json={
        "user_id": sample_user["id"],
        "document_type": "aadhaar",
        "filename": "aadhaar.pdf",
        "storage_url": "gs://hazela-test/aadhaar.pdf",
    })
    resp = client.get(f"/api/documents?user_id={sample_user['id']}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ─────────────────────────────────────────────────────────────────────────────
# Status trigger (Person 4 handoff)
# ─────────────────────────────────────────────────────────────────────────────

def test_status_trigger_not_found(client):
    resp = client.post("/api/internal/status/trigger", json={"application_id": "app_nonexistent"})
    assert resp.status_code == 404


def test_status_trigger_existing_app(client, sample_user):
    create_resp = client.post("/api/applications", json={
        "user_id": sample_user["id"],
        "scheme_id": "scheme_pm_nsp_merit",
    })
    app_id = create_resp.json()["id"]

    resp = client.post("/api/internal/status/trigger", json={"application_id": app_id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["application_id"] == app_id
    assert data["status"] == "draft"


# ─────────────────────────────────────────────────────────────────────────────
# Chat
# ─────────────────────────────────────────────────────────────────────────────

def test_chat_endpoint(client):
    resp = client.post("/api/chat", json={
        "user_id": "user_test_chat",
        "message": "Which scholarships can I apply for?",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "response_text" in data
    assert "session_id" in data
    assert len(data["response_text"]) > 0


def test_chat_maintains_session(client):
    # First turn
    resp1 = client.post("/api/chat", json={
        "user_id": "user_session_test",
        "message": "Hello",
    })
    session_id = resp1.json()["session_id"]

    # Second turn with same session_id
    resp2 = client.post("/api/chat", json={
        "user_id": "user_session_test",
        "message": "Which schemes are available?",
        "session_id": session_id,
    })
    assert resp2.status_code == 200
