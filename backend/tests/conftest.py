"""
Shared pytest fixtures for Hazela tests.
All tests run against the in-memory Firestore stub — no GCP credentials needed.
"""

from __future__ import annotations

import os
import pytest
import pytest_asyncio

# Force mock mode for all tests — no real GCP or Gemini calls
os.environ.setdefault("GEMINI_API_KEY", "")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "")
os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", "")


@pytest.fixture(autouse=True)
def reset_firestore_stub():
    """Reset the in-memory Firestore stub before each test."""
    from app.services.firestore_service import get_stub
    stub = get_stub()
    stub._data = {
        "users": {},
        "schemes": {},
        "documents": {},
        "applications": {},
        "application_events": {},
    }
    yield


@pytest.fixture
def sample_user():
    return {
        "id": "user_test_001",
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "state": "Maharashtra",
        "age": 20,
        "annual_income_inr": 240000,
        "education_level": "UG",
        "caste_category": "SC",
        "gender": "female",
        "institution_name": "Mumbai University",
        "course_name": "B.Sc. Computer Science",
        "status": "active",
    }


@pytest.fixture
def sample_user_male_general():
    return {
        "id": "user_test_002",
        "name": "Rahul Verma",
        "email": "rahul@example.com",
        "state": "Maharashtra",
        "age": 22,
        "annual_income_inr": 600000,
        "education_level": "UG",
        "caste_category": "General",
        "gender": "male",
        "institution_name": "Pune University",
        "course_name": "B.E. Mechanical",
        "status": "active",
    }


@pytest.fixture
def sample_scheme_id():
    return "scheme_aicte_pragati"


@pytest.fixture
def test_client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
