"""
POST /api/voice/session — IVR session entry point for Person 3 (feature/voice-ivr).

Person 3's Twilio/Exotel integration calls this endpoint to start an agent session
via voice. This route creates an ADK session and returns the session_id + opening message.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import get_runner
from agents.runner import HazelaRunner

router = APIRouter(prefix="/api", tags=["voice"])
logger = logging.getLogger(__name__)


class VoiceSessionRequest(BaseModel):
    user_id: str
    phone_number: str = ""
    language: str = "en"   # "en" or "hi"
    initial_message: str = "Hello, I need help with government scholarships."


class VoiceSessionResponse(BaseModel):
    session_id: str
    message: str
    language: str


@router.post(
    "/voice/session",
    response_model=VoiceSessionResponse,
    summary="Start a voice IVR agent session (Person 3 integration)",
)
async def start_voice_session(
    body: VoiceSessionRequest,
    runner: HazelaRunner = Depends(get_runner),
) -> VoiceSessionResponse:
    """
    Entry point for Person 3's IVR integration.
    Creates a new agent session and returns the opening response for TTS.

    Person 3 should:
    1. Call this endpoint at the start of a call to get session_id.
    2. Use POST /api/chat with the same session_id for subsequent turns.
    3. Convert response_text to TTS and play to the caller.
    """
    session_id = str(uuid.uuid4())
    try:
        result = await runner.run_agent(
            user_id=body.user_id,
            message=body.initial_message,
            session_id=session_id,
        )
        return VoiceSessionResponse(
            session_id=session_id,
            message=result["response_text"] or "Welcome to Hazela. How can I help you today?",
            language=body.language,
        )
    except Exception as exc:
        logger.error("Voice session error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
