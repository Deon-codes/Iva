"""Smoke test for new mock/demo endpoints."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.main import app
from fastapi.testclient import TestClient


def test_verification_status():
    """GET /api/verification/status returns REAL/MOCK transparency labels."""
    client = TestClient(app)
    resp = client.get("/api/verification/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "extraction" in data
    assert data["extraction"]["type"] == "REAL"
    assert "MOCK" in data["government_portal_submission"]["type"]


def test_document_match():
    """POST /api/documents/match returns match result with verification metadata."""
    client = TestClient(app)
    resp = client.post("/api/documents/match", json={
        "user_id": "test-user",
        "required": ["income_certificate", "caste_certificate"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "missing" in data
    assert "verification_metadata" in data
    assert "MOCK" in data["verification_metadata"]["government_verification"]["type"]


def test_mock_government_unseeded():
    """GET /api/mock-government returns under_review by default."""
    client = TestClient(app)
    resp = client.get("/api/mock-government/applications/test-app-1")
    assert resp.status_code == 200
    assert resp.json()["status"] == "under_review"


def test_mock_government_seed():
    """POST /api/mock-government/seed + GET returns seeded status."""
    client = TestClient(app)
    resp = client.post("/api/mock-government/applications/test-app-1/seed",
                       json={"status": "approved"})
    assert resp.status_code == 204
    resp = client.get("/api/mock-government/applications/test-app-1")
    assert resp.json()["status"] == "approved"


def test_application_lifecycle():
    """Full lifecycle: create → mock-submit → status-check → events."""
    client = TestClient(app)

    # Create
    resp = client.post("/api/applications", json={
        "user_id": "test-user", "scheme_id": "test-scheme"
    })
    assert resp.status_code == 201
    app_id = resp.json()["id"]

    # Mock submit
    resp = client.post(f"/api/applications/{app_id}/mock-submit", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert data["application_id"] == app_id
    assert "MOCK" in str(data["verification_context"])

    # Status check
    resp = client.post(f"/api/applications/{app_id}/status-check")
    assert resp.status_code == 200
    data = resp.json()
    assert data["application_id"] == app_id
    assert "verification_context" in data

    # Events timeline
    resp = client.get(f"/api/applications/{app_id}/events")
    assert resp.status_code == 200
    events = resp.json()
    assert isinstance(events, list)
    assert len(events) >= 1
