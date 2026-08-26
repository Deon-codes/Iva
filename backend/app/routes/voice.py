import logging
from fastapi import APIRouter, Form, Response, HTTPException, Depends
from pydantic import BaseModel
from app.services.voice_service import voice_service, detect_language

router = APIRouter(prefix="/api/voice", tags=["voice"])
logger = logging.getLogger(__name__)


# Pydantic models for explicit mock JSON testing
class MockVoiceRequest(BaseModel):
    call_sid: str = "mock_call_sid_123"
    phone_number: str = "+919876543210"
    message: str = "scholarship"
    is_mock: bool = True


class MockVoiceResponse(BaseModel):
    call_sid: str
    response_text: str
    language: str
    is_mock: bool
    mock_state: str


@router.post("/incoming", response_class=Response)
async def voice_incoming(
    CallSid: str = Form(...),
    From: str = Form("+910000000000")
):
    """
    Twilio Incoming Call Webhook.
    Starts the telephony session and issues the greeting.
    """
    try:
        session = await voice_service.get_or_create_session(CallSid, From)
        
        # Select initial message
        if session["is_mock"]:
            msg = "[MOCK SIMULATION] Welcome to the Hazela Mock Voice System. This is a testing simulation and NOT a real government service. Aap sarkari yojana aur scholarship ke baare mein kya jaana chahte hain?"
        else:
            msg = "Namaste. Main aapki sarkari yojana aur scholarship application mein madad karne ke liye hoon. Aap kya jaana chahte hain?"
            
        xml_content = voice_service.generate_twiML(msg, session["language"])
        return Response(content=xml_content, media_type="application/xml")
    except Exception as exc:
        logger.error("Error in voice_incoming webhook: %s", exc, exc_info=True)
        # Always return a polite error XML on failure rather than crashing or faking
        error_xml = voice_service.generate_error_twiML(
            "Humare servers par takneeki samasya hai. Kripya baad mein dobara call karein.",
            "hi"
        )
        return Response(content=error_xml, media_type="application/xml")


@router.post("/respond", response_class=Response)
async def voice_respond(
    CallSid: str = Form(...),
    From: str = Form("+910000000000"),
    SpeechResult: str = Form(None)
):
    """
    Twilio Gather Action Webhook.
    Receives user utterance transcript, processes it, and responds.
    """
    # 1. Retrieve or create session
    try:
        session = await voice_service.get_or_create_session(CallSid, From)
    except Exception as exc:
        logger.error("Session fetch failed in respond: %s", exc)
        error_xml = voice_service.generate_error_twiML(
            "Humare servers par takneeki samasya hai. Kripya baad mein dobara call karein.",
            "hi"
        )
        return Response(content=error_xml, media_type="application/xml")

    # 2. Check for silence/empty speech
    if not SpeechResult or not SpeechResult.strip():
        logger.info("SpeechResult is empty for call: %s", CallSid)
        silence_msg = "Maaf kijiye, mujhe aapki baat samajh nahi aayi. Kripya dobara boliye." if session["language"] == "hi" else "Sorry, I did not catch that. Please speak again."
        xml_content = voice_service.generate_twiML(silence_msg, session["language"])
        return Response(content=xml_content, media_type="application/xml")

    # 3. Process utterance
    try:
        response_text = await voice_service.process_utterance(CallSid, SpeechResult)
        xml_content = voice_service.generate_twiML(response_text, session["language"])
        return Response(content=xml_content, media_type="application/xml")
    except Exception as exc:
        logger.error("Error processing voice utterance: %s", exc, exc_info=True)
        # Ensure we return a strict error message on failure
        error_msg = "Humare servers par takneeki samasya hai. Kripya baad mein dobara call karein." if session["language"] == "hi" else "We are experiencing server issues. Please call back later."
        error_xml = voice_service.generate_error_twiML(error_msg, session["language"])
        return Response(content=error_xml, media_type="application/xml")


@router.post("/status")
async def voice_status(
    CallSid: str = Form(...),
    CallStatus: str = Form(None)
):
    """
    Twilio Call Status Webhook.
    Cleans up active session resources once the call terminates.
    """
    logger.info("Call status update: call %s status is %s", CallSid, CallStatus)
    voice_service.clean_session(CallSid)
    return {"status": "cleaned"}


@router.post("/mock", response_model=MockVoiceResponse)
async def voice_mock(request: MockVoiceRequest):
    """
    Explicit JSON Mock route for simulated development/testing.
    This bypasses Twilio XML/TwiML and operates completely on JSON structure.
    Used for local testing, test suites, and mock CLI verification.
    """
    try:
        session = await voice_service.get_or_create_session(
            request.call_sid, 
            request.phone_number, 
            is_mock=request.is_mock
        )
        
        response_text = await voice_service.process_utterance(request.call_sid, request.message)
        
        return MockVoiceResponse(
            call_sid=request.call_sid,
            response_text=response_text,
            language=session["language"],
            is_mock=session["is_mock"],
            mock_state=session["mock_state"]
        )
    except Exception as exc:
        logger.error("Error in voice_mock: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
