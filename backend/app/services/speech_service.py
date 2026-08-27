import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configured mock speech mode check
MOCK_SPEECH_MODE = os.getenv("MOCK_SPEECH_MODE", "false").lower() == "true"

# Try importing the Google Cloud Speech & TTS clients
HAS_GOOGLE_CLOUD = False
speech_client = None
tts_client = None

try:
    from google.cloud import speech
    from google.cloud import texttospeech
    
    # We initialize clients only if credentials are set or we are not in mock speech mode
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or not MOCK_SPEECH_MODE:
        speech_client = speech.SpeechClient()
        tts_client = texttospeech.TextToSpeechClient()
        HAS_GOOGLE_CLOUD = True
        logger.info("Google Cloud STT & TTS clients successfully initialized.")
except Exception as exc:
    logger.warning("Could not initialize Google Cloud STT/TTS clients: %s. Fallback to mock speech will occur if MOCK_SPEECH_MODE=true.", exc)


class SpeechService:
    def __init__(self) -> None:
        pass

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        language: str,
        sample_rate: int,
        session: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Transcribes mono 16-bit PCM audio bytes to text.
        If MOCK_SPEECH_MODE is enabled, returns deterministic mock text based on session state.
        """
        if MOCK_SPEECH_MODE:
            if session is None:
                return "scholarship"
            
            # Deterministic progression of the mock state machine
            state = session.get("mock_state", "welcome")
            last_speech = session.get("last_speech_mock", "")
            
            if state == "welcome":
                session["last_speech_mock"] = "scholarship"
                return "scholarship"
            elif state == "collect_state":
                session["last_speech_mock"] = "Maharashtra"
                return "Maharashtra"
            elif state == "collect_education":
                session["last_speech_mock"] = "College"
                return "College"
            elif state == "collect_income":
                # Check if we should query status or OTP in subsequent mock turns
                if last_speech == "College":
                    session["last_speech_mock"] = "Two lakh rupees"
                    return "Two lakh rupees"
                elif last_speech == "Two lakh rupees":
                    session["last_speech_mock"] = "What is my application status"
                    return "What is my application status"
                else:
                    session["last_speech_mock"] = "Bypass OTP"
                    return "Bypass OTP"
            else:
                return "status"

        # Real Google STT Execution
        if not HAS_GOOGLE_CLOUD or not speech_client:
            raise RuntimeError("Real Speech-to-Text is unavailable (missing dependencies or GCP credentials). Ensure MOCK_SPEECH_MODE=true is set for local testing.")

        try:
            from google.cloud import speech
            
            audio = speech.RecognitionAudio(content=audio_bytes)
            
            # Configure specifically for telephony audio (phone_call model)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=sample_rate,
                language_code="hi-IN" if language == "hi" else "en-IN",
                model="phone_call",
                use_enhanced=True
            )
            
            logger.info("Sending STT request to Google Cloud (model: phone_call, rate: %dHz)...", sample_rate)
            response = speech_client.recognize(config=config, audio=audio)
            
            transcript = ""
            for result in response.results:
                transcript += result.alternatives[0].transcript
            
            logger.info("Google STT transcription result: %s", transcript)
            return transcript.strip()
        except Exception as exc:
            logger.error("Error in real Google STT transcribe_audio: %s", exc)
            raise RuntimeError(f"Google STT transaction failed: {exc}")

    async def synthesize_text(self, text: str, language: str, sample_rate: int) -> bytes:
        """
        Synthesizes text response back into raw 16-bit mono PCM audio bytes.
        """
        if MOCK_SPEECH_MODE:
            logger.info("Mock TTS: returning dummy PCM audio chunk for text: %s", text)
            # Return dummy PCM audio (silence / 8000Hz or 16000Hz)
            # 1 second of 16-bit mono PCM audio at 16000Hz is 32000 bytes.
            # At 8000Hz, it is 16000 bytes.
            duration_sec = 0.5
            total_bytes = int(sample_rate * 2 * duration_sec)
            # Create dummy bytes (e.g. silent 16-bit PCM bytes)
            return b'\x00' * total_bytes

        # Real Google TTS Execution
        if not HAS_GOOGLE_CLOUD or not tts_client:
            raise RuntimeError("Real Text-to-Speech is unavailable (missing dependencies or GCP credentials). Ensure MOCK_SPEECH_MODE=true is set for local testing.")

        try:
            from google.cloud import texttospeech
            
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # High quality Indian voices for natural pronunciation
            voice = texttospeech.VoiceSelectionParams(
                language_code="hi-IN" if language == "hi" else "en-IN",
                name="hi-IN-Neural2-A" if language == "hi" else "en-IN-Neural2-A"
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.LINEAR16, # Raw Mono PCM 16-bit
                sample_rate_hertz=sample_rate
            )
            
            logger.info("Sending TTS request to Google Cloud (voice: %s, rate: %dHz)...", voice.name, sample_rate)
            response = tts_client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )
            
            logger.info("Google TTS synthesis complete (size: %d bytes).", len(response.audio_content))
            return response.audio_content
        except Exception as exc:
            logger.error("Error in real Google TTS synthesize_text: %s", exc)
            raise RuntimeError(f"Google TTS synthesis failed: {exc}")


# Singleton instance of the Speech Service
speech_service = SpeechService()
