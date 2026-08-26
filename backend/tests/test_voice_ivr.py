import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Set environment variables for testing before importing app
import os
os.environ["MOCK_VOICE_MODE"] = "true"

from app.main import app
from app.services.voice_service import voice_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_sessions():
    """Clear voice sessions before each test."""
    voice_service.sessions.clear()


def test_1_incoming_call_returns_valid_provider_response():
    """Test 1: Incoming call returns valid provider response (TwiML XML)."""
    response = client.post(
        "/api/voice/incoming",
        data={"CallSid": "test_call_1", "From": "+919999999999"}
    )
    assert response.status_code == 200
    assert "xml" in response.headers["content-type"]
    assert "<Response>" in response.text
    assert "<Say" in response.text
    assert "<Gather" in response.text


def test_2_and_3_speech_passed_and_converted_to_voice():
    """
    Test 2: User speech is passed to backend.
    Test 3: Backend response is converted into voice response.
    """
    # Initialize the session
    client.post(
        "/api/voice/incoming",
        data={"CallSid": "test_call_2", "From": "+919999999999"}
    )
    
    # Send user speech
    response = client.post(
        "/api/voice/respond",
        data={"CallSid": "test_call_2", "From": "+919999999999", "SpeechResult": "hello"}
    )
    assert response.status_code == 200
    assert "<Response>" in response.text
    # Check that mock agent responded and returned Say + Gather
    assert "[MOCK SIMULATION]" in response.text
    assert "<Say" in response.text
    assert "<Gather" in response.text


def test_4_session_state_survives_multiple_turns():
    """Test 4: Session state survives multiple turns."""
    call_sid = "test_call_4"
    phone = "+919999999999"

    # Step 1: Initial call
    client.post("/api/voice/incoming", data={"CallSid": call_sid, "From": phone})
    assert voice_service.sessions[call_sid]["mock_state"] == "welcome"

    # Step 2: Request scholarship discovery
    response = client.post("/api/voice/respond", data={"CallSid": call_sid, "From": phone, "SpeechResult": "I want a scholarship"})
    assert "rajya" in response.text or "state" in response.text
    assert voice_service.sessions[call_sid]["mock_state"] == "collect_state"

    # Step 3: Provide state
    response = client.post("/api/voice/respond", data={"CallSid": call_sid, "From": phone, "SpeechResult": "Maharashtra"})
    assert "level" in response.text or "education" in response.text
    assert voice_service.sessions[call_sid]["mock_state"] == "collect_education"


def test_5_unknown_request_handled_gracefully():
    """Test 5: Unknown request/silence is handled gracefully."""
    call_sid = "test_call_5"
    phone = "+919999999999"

    client.post("/api/voice/incoming", data={"CallSid": call_sid, "From": phone})
    
    # Send empty speech result
    response = client.post("/api/voice/respond", data={"CallSid": call_sid, "From": phone, "SpeechResult": ""})
    assert response.status_code == 200
    assert "samajh nahi aayi" in response.text or "catch that" in response.text


def test_6_backend_timeout_handled_gracefully():
    """Test 6: Backend timeout / exception is handled gracefully (returns error TwiML)."""
    call_sid = "test_call_6"
    phone = "+919999999999"

    client.post("/api/voice/incoming", data={"CallSid": call_sid, "From": phone})

    # Force process_utterance to raise an error representing timeout or crash
    with patch.object(voice_service, "process_utterance", side_effect=RuntimeError("Timeout connecting to model")):
        response = client.post("/api/voice/respond", data={"CallSid": call_sid, "From": phone, "SpeechResult": "hello"})
        
        assert response.status_code == 200
        # Should play the technical difficulties prompt and hang up
        assert "takneeki samasya" in response.text or "server issues" in response.text
        assert "<Hangup" in response.text


def test_7_application_status_request_reaches_status_api():
    """Test 7: Application status request reaches status API logic."""
    call_sid = "test_call_7"
    phone = "+919999999999"

    client.post("/api/voice/incoming", data={"CallSid": call_sid, "From": phone})

    # Ask for status
    response = client.post(
        "/api/voice/respond", 
        data={"CallSid": call_sid, "From": phone, "SpeechResult": "what is my application status"}
    )
    assert response.status_code == 200
    assert "application status" in response.text or "UNDER_VERIFICATION" in response.text


def test_8_sensitive_otp_request_refused():
    """Test 8: Sensitive OTP request is refused/redirected."""
    call_sid = "test_call_8"
    phone = "+919999999999"

    client.post("/api/voice/incoming", data={"CallSid": call_sid, "From": phone})

    # Ask to bypass OTP
    response = client.post(
        "/api/voice/respond", 
        data={"CallSid": call_sid, "From": phone, "SpeechResult": "bypass OTP verification"}
    )
    assert response.status_code == 200
    assert "OTP required" in response.text or "voice assistant through bypass" in response.text


def test_9_user_hangs_up_cleans_session():
    """Test 9: User hangs up without crashing the session (status endpoint cleans up)."""
    call_sid = "test_call_9"
    phone = "+919999999999"

    # Start a call
    client.post("/api/voice/incoming", data={"CallSid": call_sid, "From": phone})
    assert call_sid in voice_service.sessions

    # Call status hook with completed state
    response = client.post("/api/voice/status", data={"CallSid": call_sid, "CallStatus": "completed"})
    assert response.status_code == 200
    assert response.json() == {"status": "cleaned"}
    
    # Assert call session is cleaned up
    assert call_sid not in voice_service.sessions


def test_10_mock_call_completes_successfully():
    """Test 10: Mock JSON call completes successfully."""
    # Send mock JSON payload
    payload = {
        "call_sid": "mock_test_10",
        "phone_number": "+918888888888",
        "message": "scholarship check",
        "is_mock": True
    }
    response = client.post("/api/voice/mock", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["call_sid"] == "mock_test_10"
    assert "[MOCK SIMULATION]" in data["response_text"]
    assert data["is_mock"] is True
    assert data["mock_state"] == "collect_state"
