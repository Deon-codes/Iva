"""POST /api/chat — the primary agentic endpoint."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_runner
from app.models.chat import ChatRequest, ChatResponse, AgentAction
from agents.runner import HazelaRunner

router = APIRouter(prefix="/api", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse, summary="Send a message to the Hazela agent")
async def chat(
    request: ChatRequest,
    runner: HazelaRunner = Depends(get_runner),
) -> ChatResponse:
    """
    Send a natural language message to the Hazela orchestrator agent.
    The agent will route to Discovery, Legitimacy, or Form-Prep sub-agents as needed.

    - **user_id**: Required. Identifies the user (profile must exist for eligibility checks).
    - **message**: Natural language input, e.g. "Which scholarships can I apply for?"
    - **session_id**: Optional. Provide to continue a multi-turn conversation.
    """
    try:
        result = await runner.run_agent(
            user_id=request.user_id,
            message=request.message,
            session_id=request.session_id,
            context=request.context,
        )
        return ChatResponse(
            session_id=result["session_id"],
            response_text=result["response_text"],
            actions=[AgentAction(**a) for a in result.get("actions", [])],
            status_update=result.get("status_update"),
            suggested_next_steps=result.get("suggested_next_steps", []),
            prepared_application_id=result.get("prepared_application_id"),
        )
    except Exception as exc:
        logger.error("Chat endpoint error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
