import logging
from fastapi import APIRouter, Form, Response, HTTPException, Depends
from pydantic import BaseModel
from app.services.voice_service import voice_service, detect_language

router = APIRouter(prefix="/api/voice", tags=["voice"])
logger = logging.getLogger("voice")
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

    logger.info("VOICE_INCOMING received call_sid=%s", CallSid)

    try:
        session = await voice_service.get_or_create_session(
            CallSid,
            From
        )

        logger.info(
            "VOICE_INCOMING session_created call_sid=%s mock=%s",
            CallSid,
            session["is_mock"],
        )

        if session["is_mock"]:
            msg = (
                "[MOCK SIMULATION] Welcome to the Iva Mock Voice System. "
                "This is a testing simulation and NOT a real government service. "
                "Aap sarkari yojana aur scholarship ke baare mein kya jaana chahte hain?"
            )
        else:
            msg = (
                "Namaste. Main aapki sarkari yojana aur scholarship "
                "application mein madad karne ke liye hoon. "
                "Aap kya jaana chahte hain?"
            )

        xml_content = voice_service.generate_twiML(
            msg,
            session["language"]
        )

        logger.info(
            "VOICE_INCOMING returning_twiml call_sid=%s",
            CallSid,
        )

        return Response(
            content=xml_content,
            media_type="application/xml"
        )

    except Exception as exc:
        logger.error(
            "Error in voice_incoming webhook: %s",
            exc,
            exc_info=True
        )

        error_xml = voice_service.generate_error_twiML(
            "Humare servers par takneeki samasya hai. "
            "Kripya baad mein dobara call karein.",
            "hi"
        )

        return Response(
            content=error_xml,
            media_type="application/xml"
        )

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


import base64
import json
import asyncio
import struct
import math
from fastapi import WebSocket, WebSocketDisconnect
from app.services.speech_service import speech_service

# Helper for silence detection
def calculate_rms(audio_chunk: bytes) -> float:
    count = len(audio_chunk) // 2
    if count == 0:
        return 0.0
    format_string = f"{count}h"
    try:
        shorts = struct.unpack(format_string, audio_chunk)
    except struct.error:
        return 0.0
    sum_squares = 0.0
    for sample in shorts:
        n = sample / 32768.0
        sum_squares += n * n
    return math.sqrt(sum_squares / count)


@router.websocket("/ws")
async def exotel_ws(websocket: WebSocket):
    """
    Exotel Voicebot WebSocket Integration Endpoint.
    Manages live bidirectional binary audio stream, transcribes caller speech,
    queries Iva orchestrator, and synthesizes audio responses.
    """
    await websocket.accept()
    logger.info("EXOTEL WS CONNECTED")
    
    stream_sid = None
    session = None
    sample_rate = 8000 # default fallback
    
    # State variables for speech / silence tracking
    audio_buffer = bytearray()
    has_speech = False
    silence_duration_ms = 0
    silence_threshold = 0.015 # 1.5% amplitude threshold for speech detection
    silence_timeout_ms = 1500 # 1.5s of silence considered end of turn
    min_speech_duration_ms = 800 # Filter out transient noises under 0.8s
    
    async def stream_audio_to_exotel(audio_bytes: bytes, current_sid: str, current_rate: int):
        """Helper to stream PCM audio back to Exotel in 100ms chunks."""
        # 100ms chunk size = sample_rate * 2 bytes/sample * 0.1s
        chunk_size = int(current_rate * 0.2)
        logger.info("Exotel outbound streaming started (total: %d bytes, chunk size: %d bytes)...", len(audio_bytes), chunk_size)
        for i in range(0, len(audio_bytes), chunk_size):
            chunk = audio_bytes[i:i + chunk_size]
            # Zero-pad chunk if it is smaller than chunk_size (required for raw PCM stream sync)
            if len(chunk) < chunk_size:
                chunk += b'\x00' * (chunk_size - len(chunk))
            
            payload = base64.b64encode(chunk).decode("utf-8")
            media_event = {
                "event": "media",
                "streamSid": current_sid,
                "media": {
                    "payload": payload
                }
            }
            await websocket.send_json(media_event)
            await asyncio.sleep(0.1) # Pace output in real-time
        logger.info("EXOTEL AUDIO SENT")

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            event = msg.get("event")
            
            if event == "connected":
                logger.info("EXOTEL WS CONNECTED EVENT")
                
            elif event == "start":
                logger.info("EXOTEL CALL STARTED")
                start_block = msg.get("start", {})
                stream_sid = msg.get("streamSid") or msg.get("stream_sid") or start_block.get("streamSid") or start_block.get("stream_sid")
                
                # Retrieve sample rate
                rate_val = start_block.get("sampleRate") or websocket.query_params.get("sample-rate")
                if rate_val:
                    try:
                        sample_rate = int(rate_val)
                    except ValueError:
                        sample_rate = 8000
                else:
                    sample_rate = 8000
                    
                phone_number = start_block.get("customParameters", {}).get("phone") or start_block.get("from") or start_block.get("callerId") or "+910000000000"
                logger.info("EXOTEL SESSION START - StreamSid: %s, Phone: %s, Rate: %dHz", stream_sid, phone_number, sample_rate)
                
                # Fetch or create the session
                session = await voice_service.get_or_create_session(stream_sid, phone_number)
                
                # Play greeting immediately
                if session["is_mock"]:
                    greeting_text = "[MOCK SIMULATION] Welcome to the Iva Mock Voice System. This is a testing simulation and NOT a real government service. Aap sarkari yojana aur scholarship ke baare mein kya jaana chahte hain?"
                else:
                    greeting_text = "Namaste. Main aapki sarkari yojana aur scholarship application mein madad karne ke liye hoon. Aap kya jaana chahte hain?"
                
                greeting_audio = await speech_service.synthesize_text(greeting_text, session["language"], sample_rate)
                await stream_audio_to_exotel(greeting_audio, stream_sid, sample_rate)
                
            elif event == "media":
                media_block = msg.get("media", {})
                payload = media_block.get("payload")
                if payload and stream_sid and session:
                    chunk = base64.b64decode(payload)
                    chunk_rms = calculate_rms(chunk)
                    
                    if chunk_rms > silence_threshold:
                        has_speech = True
                        silence_duration_ms = 0
                        audio_buffer.extend(chunk)
                    else:
                        silence_duration_ms += 100 # each chunk represents ~100ms
                        if has_speech:
                            audio_buffer.extend(chunk)
                            if silence_duration_ms >= silence_timeout_ms:
                                logger.info("EXOTEL SILENCE DETECTED, PROCESSING UTTERANCE...")
                                
                                # Process speech
                                duration_ms = len(audio_buffer) / (sample_rate * 2) * 1000
                                if duration_ms >= min_speech_duration_ms:
                                    logger.info("EXOTEL TRANSCRIPT: [transcribing]")
                                    try:
                                        transcript = await speech_service.transcribe_audio(
                                            bytes(audio_buffer),
                                            session["language"],
                                            sample_rate,
                                            session
                                        )
                                        
                                        if transcript.strip():
                                            logger.info("EXOTEL TRANSCRIPT: %s", transcript)
                                            response_text = await voice_service.process_utterance(stream_sid, transcript)
                                            logger.info("IVA RESPONSE: %s", response_text)
                                            
                                            response_audio = await speech_service.synthesize_text(
                                                response_text,
                                                session["language"],
                                                sample_rate
                                            )
                                            await stream_audio_to_exotel(response_audio, stream_sid, sample_rate)
                                        else:
                                            logger.info("EXOTEL TRANSCRIPT: [empty or silent]")
                                    except Exception as err:
                                        logger.error("Error processing stream utterance: %s", err, exc_info=True)
                                
                                # Reset buffer & states
                                audio_buffer = bytearray()
                                has_speech = False
                                silence_duration_ms = 0
                                
            elif event == "stop":
                logger.info("EXOTEL CALL ENDED")
                if stream_sid:
                    voice_service.clean_session(stream_sid)
                break
                
    except WebSocketDisconnect:
        logger.info("EXOTEL WS DISCONNECTED")
        if stream_sid:
            voice_service.clean_session(stream_sid)
    except Exception as exc:
        logger.error("Error in exotel_ws lifecycle: %s", exc, exc_info=True)
        if stream_sid:
            voice_service.clean_session(stream_sid)
