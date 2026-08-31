import os
import logging
import uuid
from typing import Dict, Any, Optional
from twilio.twiml.voice_response import VoiceResponse, Gather
from dotenv import load_dotenv
logger = logging.getLogger(__name__)

# Load the root .env file robustly relative to this source file
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".env"))
load_dotenv(dotenv_path)

# Configured mock mode check
MOCK_VOICE_MODE = os.getenv("MOCK_VOICE_MODE", "false").lower() == "true"

# Try importing the real runner and dependencies
try:
    from agents.runner import iva_runner
    HAS_REAL_RUNNER = True
except ImportError:
    HAS_REAL_RUNNER = False
    iva_runner = None


def detect_language(transcript: str, current_lang: str) -> str:
    """Simple heuristic language detection based on common English keywords in the domain."""
    text_lower = transcript.lower()
    english_keywords = [
        "scholarship", "scheme", "eligible", "eligibility", "document", 
        "documents", "status", "reject", "rejection", "application", "college", 
        "income", "certificate", "yes", "no", "hello", "hi", "help"
    ]
    if any(word in text_lower for word in english_keywords):
        return "en"
    return current_lang


def process_mock_message(session: Dict[str, Any], message: str) -> str:
    """
    Simulates a high-fidelity dialog flow with clear mock banners.
    Does NOT appear to be a real government service or return real government data.
    """
    message_lower = message.lower()
    state = session.get("mock_state", "welcome")

    # Handle explicit status/rejection queries at any stage
    if "status" in message_lower or "rejection" in message_lower or "reject" in message_lower:
        if "reject" in message_lower or "fail" in message_lower or "reason" in message_lower:
            return "[MOCK SIMULATION] Aapki simulated application reject hui hai kyunki mock income certificate expired tha. Aapko updated certificate submit karna hoga."
        else:
            return "[MOCK SIMULATION] Your mock application status is: UNDER_VERIFICATION. This is a testing simulation."

    # Handle document requirement queries at any stage
    if "document" in message_lower or "papers" in message_lower or "kagaz" in message_lower or "certificate" in message_lower:
        return "[MOCK SIMULATION] Verification ke liye aapko income certificate aur marksheet ki zarurat hogi."

    # Handle sensitive OTP verification warnings / bypass attempts
    if "otp" in message_lower or "bypass" in message_lower or "password" in message_lower or "pin" in message_lower:
        return "[MOCK SIMULATION] Identity verification ke liye OTP required hai. Yeh step voice assistant through bypass nahi kiya ja sakta. Aapko ise portal par swayam complete karna hoga."

    # Standard conversational discovery flow
    if state == "welcome":
        if any(keyword in message_lower for keyword in ["scholarship", "yojana", "apply", "eligible", "eligibility"]):
            session["mock_state"] = "collect_state"
            return "[MOCK SIMULATION] Main aapki eligibility check karunga. Aap kis rajya mein rehte hain?"
        else:
            return "[MOCK SIMULATION] Namaste. Main aapki mock yojana aur scholarship application mein madad karne ke liye hoon. Aap kya jaana chahte hain?"

    elif state == "collect_state":
        session["mock_data"]["state"] = message
        session["mock_state"] = "collect_education"
        return "[MOCK SIMULATION] Aapki padhai kis level par hai? College ya school?"

    elif state == "collect_education":
        session["mock_data"]["education"] = message
        session["mock_state"] = "collect_income"
        return "[MOCK SIMULATION] Aapki annual family income kitni hai?"

    elif state == "collect_income":
        session["mock_data"]["income"] = message
        session["mock_state"] = "eligibility_result"
        return "[MOCK SIMULATION] Available mock information ke hisaab se aap Maharashtra Rajarshi Shahu scholarship ke liye eligible lagte hain. Aapko mock income certificate aur marksheet ki zarurat hogi."

    elif state == "eligibility_result":
        session["mock_state"] = "welcome"
        return "[MOCK SIMULATION] Kya aap kisi aur mock scholarship ke baare mein jaana chahte hain?"

    else:
        session["mock_state"] = "welcome"
        return "[MOCK SIMULATION] Kripya batayein ki aap kya jaana chahte hain?"


class VoiceService:
    def __init__(self) -> None:
        # Maps CallSid -> session dict
        self.sessions: Dict[str, Dict[str, Any]] = {}

    async def get_or_create_session(self, call_sid: str, phone_number: str, is_mock: bool = False) -> Dict[str, Any]:
        """
        Retrieves or creates a call session.
        If real mode is requested but the runner is unavailable, raises a RuntimeError.
        """
        if call_sid in self.sessions:
            return self.sessions[call_sid]

        use_mock = is_mock or MOCK_VOICE_MODE

        if not use_mock and not HAS_REAL_RUNNER:
            logger.error("Real voice mode requested but agents.runner is not available.")
            raise RuntimeError("Real voice orchestrator not available.")

        session_id = str(uuid.uuid4())
        user_id = f"usr_telephony_{phone_number.replace('+', '')}"

        # If real mode, register user profile dynamically in Firestore if possible
        if not use_mock:
            try:
                from app.services import firestore_service
                existing_user = await firestore_service.get_user(user_id)
                if not existing_user:
                    await firestore_service.upsert_user(user_id, {
                        "name": "Voice Caller",
                        "phone": phone_number,
                        "role": "applicant",
                        "status": "active"
                    })
            except Exception as e:
                logger.warning("Failed to check/upsert user in firestore: %s", e)

        session = {
            "session_id": session_id,
            "user_id": user_id,
            "phone_number": phone_number,
            "language": "hi",
            "is_mock": use_mock,
            "mock_state": "welcome",
            "mock_data": {}
        }
        self.sessions[call_sid] = session
        return session

    async def process_utterance(self, call_sid: str, message: str) -> str:
        """
        Processes a single user utterance.
        If in mock mode, executes mock state machine.
        Otherwise, triggers real ADK orchestrator.
        """
        if call_sid not in self.sessions:
            raise KeyError("Session does not exist for this call.")

        session = self.sessions[call_sid]
        
        # Detect and switch language if necessary
        new_lang = detect_language(message, session["language"])
        session["language"] = new_lang

        if session["is_mock"]:
            return process_mock_message(session, message)

        # Real Mode Execution
        if not HAS_REAL_RUNNER or not iva_runner:
            raise RuntimeError("Real voice orchestrator not available.")

        try:
            result = await iva_runner.run_agent(
                user_id=session["user_id"],
                message=message,
                session_id=session["session_id"]
            )
            response_text = result.get("response_text", "")
            if not response_text:
                response_text = "Main aapki sahayata nahi kar paaya. Kripya baad mein dobara call karein."
            return response_text
        except Exception as e:
            logger.error("Error calling real iva_runner: %s", e)
            raise RuntimeError(f"Failed to communicate with agent orchestrator: {e}")

    def clean_session(self, call_sid: str) -> None:
        """Removes session state when a call is completed."""
        self.sessions.pop(call_sid, None)

    def generate_twiML(self, text: str, language: str, action_url: str = "/api/voice/respond") -> str:
        """Generates a standard TwiML with Say and Gather verbs."""
        response = VoiceResponse()
        
        # Build absolute URL using VOICE_WEBHOOK_BASE_URL if configured
        base_url = os.getenv("VOICE_WEBHOOK_BASE_URL", "").rstrip("/")
        if base_url and action_url.startswith("/"):
            absolute_action_url = f"{base_url}{action_url}"
        else:
            absolute_action_url = action_url

        # Indian voices for natural pronunciation
        if language == "hi":
            voice = "Polly.Aditi"
            twilio_lang = "hi-IN"
        else:
            voice = "Polly.Raveena"
            twilio_lang = "en-IN"

        response.say(text, voice=voice, language=twilio_lang)

        # Add Gather to collect the next response
        gather = Gather(
            input="speech",
            action=absolute_action_url,
            method="POST",
            language=twilio_lang,
            timeout=5,
            speech_timeout="auto"
        )
        response.append(gather)
        
        # Silence fallback
        silence_msg = "Maaf kijiye, mujhe koi aawaz nahi aayi. Kripya dobara boliye." if language == "hi" else "Sorry, I did not hear anything. Please speak again."
        response.say(silence_msg, voice=voice, language=twilio_lang)
        
        return str(response)

    def generate_error_twiML(self, text: str, language: str) -> str:
        """Generates TwiML to play an error and hang up."""
        response = VoiceResponse()
        if language == "hi":
            voice = "Polly.Aditi"
            twilio_lang = "hi-IN"
        else:
            voice = "Polly.Raveena"
            twilio_lang = "en-IN"

        response.say(text, voice=voice, language=twilio_lang)
        response.hangup()
        return str(response)


# Singleton voice service instance
voice_service = VoiceService()
