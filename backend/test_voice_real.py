import asyncio
from app.services.voice_service import voice_service

async def main():
    session = await voice_service.get_or_create_session(
        "real-test-2",
        "9999999999",
        is_mock=False
    )

    print("\nSESSION:")
    print(session)

    messages = [
        "I want to know about government scholarships",
        "I live in Maharashtra",
        "I am studying B.Tech",
        "My family income is 5 lakh rupees",
    ]

    for i, message in enumerate(messages, 1):
        print(f"\n--- TURN {i} ---")
        print("USER:", message)

        response = await voice_service.process_utterance(
            "real-test-2",
            message
        )

        print("AGENT:", response)

asyncio.run(main())
