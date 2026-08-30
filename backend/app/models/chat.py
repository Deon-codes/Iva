"""
Pydantic models for Chat API (POST /api/chat).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming request to POST /api/chat."""

    user_id: str
    message: str
    session_id: Optional[str] = None     # omit for a fresh session
    context: Dict[str, Any] = Field(default_factory=dict)


class AgentAction(BaseModel):
    """One tool call or sub-agent delegation recorded by the orchestrator."""

    tool_name: str
    input_summary: str
    output_summary: str


class ChatResponse(BaseModel):
    """Response from POST /api/chat."""

    session_id: str
    response_text: str
    actions: List[AgentAction] = Field(default_factory=list)
    status_update: Optional[str] = None      # e.g. "action_required"
    suggested_next_steps: List[str] = Field(default_factory=list)
    # Populated when the agent has prepared an application
    prepared_application_id: Optional[str] = None


# ─── Chat History models ─────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """A single message in a conversation."""

    role: str               # "user" | "agent"
    content: str
    timestamp: str = "Just now"
    actions: List[AgentAction] = Field(default_factory=list)


class ChatSession(BaseModel):
    """A conversation session."""

    id: str
    user_id: str
    title: str = "New chat"
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""


class ChatSessionListItem(BaseModel):
    """Lightweight projection for the history sidebar."""

    id: str
    title: str
    last_message: str = ""
    updated_at: str = ""
    message_count: int = 0
