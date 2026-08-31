import asyncio
from agents.runner import iva_runner

async def main():
    r1 = await iva_runner.run_agent(
        user_id="same-process-test",
        message="I live in Maharashtra and I am studying B.Tech",
        session_id="same-process-1"
    )
    print("TURN 1:")
    print(r1["response_text"])

    r2 = await iva_runner.run_agent(
        user_id="same-process-test",
        message="My family income is 5 lakh and I am male",
        session_id="same-process-1"
    )
    print("\nTURN 2:")
    print(r2["response_text"])

asyncio.run(main())
