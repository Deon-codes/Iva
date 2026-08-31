"""POST /api/chat — the primary agentic endpoint + chat history."""

from __future__ import annotations

import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_runner
from app.models.chat import (
    ChatRequest, ChatResponse, AgentAction,
    ChatSession, ChatSessionListItem, ChatMessage,
)
from app.services import firestore_service as fs
from agents.runner import IvaRunner

router = APIRouter(prefix="/api", tags=["chat"])
logger = logging.getLogger(__name__)


# ─── POST /api/chat ──────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse, summary="Send a message to the Iva agent")
async def chat(
    request: ChatRequest,
    runner: IvaRunner = Depends(get_runner),
) -> ChatResponse:
    """
    Send a natural language message to the Iva orchestrator agent.
    The agent will route to Discovery, Legitimacy, or Form-Prep sub-agents as needed.

    - **user_id**: Required. Identifies the user (profile must exist for eligibility checks).
    - **message**: Natural language input, e.g. "Which scholarships can I apply for?"
    - **session_id**: Optional. Provide to continue a multi-turn conversation.
    """
    try:
        # Generate session_id if not provided
        session_id = request.session_id or f"chat_{uuid.uuid4().hex[:12]}"

        result = await runner.run_agent(
            user_id=request.user_id,
            message=request.message,
            session_id=session_id,
            context=request.context,
        )

        response_text = result.get("response_text", "")
        actions = [AgentAction(**a) for a in result.get("actions", [])]

        # ── Persist to chat session ──────────────────────────────────────
        from datetime import datetime as _dt
        now_str = _dt.utcnow().strftime("%Y-%m-%d %H:%M")

        session = await fs.get_chat_session(session_id)
        if session is None:
            # First message — create session with auto-title from the user message
            title = request.message[:60] + ("..." if len(request.message) > 60 else "")
            await fs.create_chat_session(request.user_id, session_id, title=title)

        # Append user message
        await fs.append_chat_message(session_id, {
            "role": "user",
            "content": request.message,
            "timestamp": now_str,
        })

        # Append agent response
        await fs.append_chat_message(session_id, {
            "role": "agent",
            "content": response_text,
            "timestamp": now_str,
            "actions": [a.model_dump() for a in actions],
        })

        return ChatResponse(
            session_id=session_id,
            response_text=response_text,
            actions=actions,
            status_update=result.get("status_update"),
            suggested_next_steps=result.get("suggested_next_steps", []),
            prepared_application_id=result.get("prepared_application_id"),
        )
    except Exception as exc:
        logger.error("Chat endpoint error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ─── GET /api/chat/history — list conversations ───────────────────────────────

@router.get("/chat/history", response_model=List[ChatSessionListItem], summary="List chat history")
async def chat_history(user_id: str = Query(..., description="User ID")) -> List[ChatSessionListItem]:
    """Return all conversation sessions for a user, most recent first."""
    sessions = await fs.list_chat_sessions_for_user(user_id)
    result = []
    for s in sessions:
        messages = s.get("messages", [])
        last_msg = messages[-1].get("content", "") if messages else ""
        # Truncate for sidebar
        if len(last_msg) > 80:
            last_msg = last_msg[:80] + "..."
        result.append(ChatSessionListItem(
            id=s["id"],
            title=s.get("title", "New chat"),
            last_message=last_msg,
            updated_at=s.get("updated_at", ""),
            message_count=len(messages),
        ))
    return result


# ─── GET /api/chat/{session_id} — retrieve a conversation ────────────────────

@router.get("/chat/{session_id}", response_model=ChatSession, summary="Get a chat session")
async def get_chat(session_id: str) -> ChatSession:
    """Retrieve a full conversation by session ID."""
    session = await fs.get_chat_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return ChatSession(
        id=session["id"],
        user_id=session["user_id"],
        title=session.get("title", "New chat"),
        messages=[ChatMessage(**m) for m in session.get("messages", [])],
        created_at=session.get("created_at", ""),
        updated_at=session.get("updated_at", ""),
    )
