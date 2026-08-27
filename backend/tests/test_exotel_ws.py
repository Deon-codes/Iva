import pytest
import base64
import json
import os

# Set environment variables for testing
os.environ["MOCK_VOICE_MODE"] = "true"
os.environ["MOCK_SPEECH_MODE"] = "true"

from fastapi.testclient import TestClient
from app.main import app
from app.services.voice_service import voice_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_sessions():
    """Clear sessions before each test."""
    voice_service.sessions.clear()


def test_websocket_route_registered():
    """Programmatically verify that /api/voice/ws is registered as a WebSocketRoute in the FastAPI app."""
    def find_websocket_route(routes, target_path):
        for r in routes:
            type_name = type(r).__name__
            if "WebSocket" in type_name and getattr(r, "path", None) == target_path:
                return r
            if type_name == "_IncludedRouter" and hasattr(r, "original_router"):
                sub_route = find_websocket_route(r.original_router.routes, target_path)
                if sub_route:
                    return sub_route
        return None

    ws_route = find_websocket_route(app.routes, "/api/voice/ws")
            
    assert ws_route is not None, "Exotel WebSocket route /api/voice/ws is not registered in FastAPI!"
    assert ws_route.endpoint.__name__ == "exotel_ws", "Exotel WebSocket endpoint name mismatch!"
    print("\n[VERIFIED] WebSocket route /api/voice/ws is correctly registered in FastAPI app.routes.")


def test_exotel_websocket_lifecycle():
    """
    Test Exotel WebSocket Endpoint:
    Simulates connected -> start -> media (speech) -> media (silence threshold triggered) -> response TTS -> stop
    """
    with client.websocket_connect("/api/voice/ws?sample-rate=16000") as ws:
        # 1. Send Connected Event
        ws.send_json({"event": "connected"})
        
        # 2. Send Start Event
        stream_sid = "test_exotel_stream_123"
        ws.send_json({
            "event": "start",
            "streamSid": stream_sid,
            "start": {
                "sampleRate": "16000",
                "callerId": "+919876543210"
            }
        })
        
        # 3. Read Greeting Audio (Greeting text is mock simulated welcome)
        # 0.5 seconds greeting in mock TTS at 16kHz = 16000 bytes.
        # Chunk size at 16kHz is 3200 bytes. 16000 / 3200 = 5 chunks.
        for _ in range(5):
            msg = ws.receive_json()
            assert msg["event"] == "media"
            assert msg["streamSid"] == stream_sid
            assert "payload" in msg["media"]
            # Verify payload is base64
            decoded = base64.b64decode(msg["media"]["payload"])
            assert len(decoded) == 3200

        # Check session is created
        assert stream_sid in voice_service.sessions
        session = voice_service.sessions[stream_sid]
        assert session["mock_state"] == "welcome"

        # 4. Stream Speech from Caller (RMS > threshold 0.015)
        # 1 second of audio = 10 chunks of 3200 bytes
        # Non-silent chunk sample: alternate 0x0100 to simulate noise / speech
        speech_chunk = b'\xe8\x03' * 1600 # 3200 bytes (PCM value 1000, RMS > 0.015)
        for _ in range(10):
            ws.send_json({
                "event": "media",
                "streamSid": stream_sid,
                "media": {
                    "payload": base64.b64encode(speech_chunk).decode("utf-8")
                }
            })

        # 5. Stream Silence (RMS < threshold 0.015 to trigger end of turn)
        # Timeout is 1.5 seconds = 15 chunks of 3200 silent bytes
        silent_chunk = b'\x00' * 3200
        for _ in range(15):
            ws.send_json({
                "event": "media",
                "streamSid": stream_sid,
                "media": {
                    "payload": base64.b64encode(silent_chunk).decode("utf-8")
                }
            })

        # 6. Read Bot's synthesized response audio chunks from the server
        # After silence detection, server does: STT ("scholarship") -> process_utterance() -> state moves to collect_state
        # Response: "[MOCK SIMULATION] Main aapki eligibility check karunga. Aap kis rajya mein rehte hain?"
        # Mock TTS duration is 0.5s = 5 chunks of 3200 bytes.
        for _ in range(5):
            msg = ws.receive_json()
            assert msg["event"] == "media"
            assert msg["streamSid"] == stream_sid
            assert "payload" in msg["media"]

        # Confirm the session state has progressed to collect_state
        assert voice_service.sessions[stream_sid]["mock_state"] == "collect_state"

        # 7. Send Stop Event
        ws.send_json({
            "event": "stop",
            "streamSid": stream_sid
        })
        import time
        time.sleep(0.2)

    # Assert that session is cleaned up
    assert stream_sid not in voice_service.sessions
