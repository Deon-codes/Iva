"""
Pydantic models for Chat API (POST /api/chat).
"""

from __future__ import annotations

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
