import sys
import os

# Ensure backend/ is in the python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set mock mode environment variable
os.environ["MOCK_VOICE_MODE"] = "true"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_mock_cli():
    print("==================================================================")
    print("            HAZELA VOICE IVR TELEPHONY CLIENT SIMULATION          ")
    print("                      [DEVELOPMENT & MOCK MODE]                   ")
    print("==================================================================")
    print("This is a CLI simulation tool. It routes inputs to the mock voice")
    print("adapter for testing. Responses will be prefixed with [MOCK SIMULATION]")
    print("to indicate they do not represent real government services or data.")
    print("Type 'hangup' or 'exit' to terminate the simulated call.")
    print("------------------------------------------------------------------")

    call_sid = "cli_simulated_call_sid"
    phone_number = "+919876543210"

    # Start the call
    print("Connecting call...")
    response = client.post(
        "/api/voice/incoming",
        data={"CallSid": call_sid, "From": phone_number}
    )

    if response.status_code != 200:
        print(f"Error starting call: {response.text}")
        return

    # Extract initial greeting from TwiML XML
    xml_text = response.text
    greeting = ""
    if "<Say" in xml_text:
        # Simple extraction
        start = xml_text.find(">") + 1
        # find Say tags
        say_start = xml_text.find("<Say")
        if say_start != -1:
            say_content_start = xml_text.find(">", say_start) + 1
            say_content_end = xml_text.find("</Say>", say_content_start)
            greeting = xml_text[say_content_start:say_content_end]

    print(f"\nSYSTEM (TTS): {greeting}\n")

    # Turn-by-turn conversation loop
    while True:
        try:
            user_input = input("YOU (speak): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nHanging up...")
            break

        if not user_input:
            continue

        if user_input.lower() in ["hangup", "exit", "quit"]:
            print("\nHanging up call...")
            client.post("/api/voice/status", data={"CallSid": call_sid, "CallStatus": "completed"})
            print("Session cleaned up. Goodbye!")
            break

        # Send response via Gather action webhook
        response = client.post(
            "/api/voice/respond",
            data={
                "CallSid": call_sid,
                "From": phone_number,
                "SpeechResult": user_input
            }
        )

        if response.status_code != 200:
            print(f"Call crashed: {response.text}")
            break

        xml_text = response.text
        system_response = ""
        say_start = xml_text.find("<Say")
        if say_start != -1:
            say_content_start = xml_text.find(">", say_start) + 1
            say_content_end = xml_text.find("</Say>", say_content_start)
            system_response = xml_text[say_content_start:say_content_end]

        print(f"\nSYSTEM (TTS): {system_response}\n")

        # Check if call was terminated (no Gather tag or Hangup tag present)
        if "<Hangup" in xml_text:
            print("Call terminated by system (Hangup).")
            break


if __name__ == "__main__":
    run_mock_cli()
