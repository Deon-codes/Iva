"""
ADK Runner — initialises the ADK session service and Runner, exposes run_agent().

This is the single entry point the FastAPI routes call.
Manages ADK session state per (user_id, session_id) pair.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

from app.config import settings

logger = logging.getLogger(__name__)


class HazelaRunner:
    """
    Wraps the Google ADK Runner with session management.
    Constructed once at app startup and shared across requests.
    """

    def __init__(self) -> None:
        self._runner: Any = None
        self._session_service: Any = None
        self._orchestrator: Any = None
        self._initialised = False

    def initialise(self) -> None:
        """Build agents and ADK runner. Called during FastAPI lifespan startup."""
        from agents.discovery_agent import create_discovery_agent
        from agents.legitimacy_agent import create_legitimacy_agent
        from agents.form_prep_agent import create_form_prep_agent
        from agents.orchestrator import create_orchestrator

        discovery = create_discovery_agent()
        legitimacy = create_legitimacy_agent()
        form_prep = create_form_prep_agent()
        self._orchestrator = create_orchestrator(discovery, legitimacy, form_prep)

        if settings.gemini_enabled:
            try:
                from google.adk.runners import Runner  # type: ignore
                from google.adk.sessions import InMemorySessionService  # type: ignore

                self._session_service = InMemorySessionService()
                self._runner = Runner(
                    agent=self._orchestrator,
                    app_name="hazela",
                    session_service=self._session_service,
                )
                logger.info("ADK Runner initialised with InMemorySessionService.")
            except Exception as exc:
                logger.error("ADK Runner init failed: %s — falling back to mock runner.", exc)
                self._runner = None
        else:
            logger.info("ADK Runner in mock mode (no GEMINI_API_KEY).")

        self._initialised = True

    async def run_agent(
        self,
        user_id: str,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Run the orchestrator agent for a user message.

        Args:
            user_id: The user sending the message.
            message: The user's natural language input.
            session_id: Existing session ID for multi-turn conversation (optional).
            context: Additional context dict passed into the agent.

        Returns:
            Dict with response_text, actions, session_id, status_update.
        """
        if not self._initialised:
            self.initialise()

        session_id = session_id or str(uuid.uuid4())

        if self._runner is not None:
            return await self._run_with_adk(user_id, message, session_id, context or {})
        else:
            return await self._run_mock(user_id, message, session_id, context or {})

    async def _run_with_adk(
        self,
        user_id: str,
        message: str,
        session_id: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute via the real ADK Runner."""
        try:
            from google.adk.sessions import Session  # type: ignore
            from google.genai.types import Content, Part  # type: ignore

            # Ensure session exists
            session = await self._session_service.get_session(
                app_name="hazela", user_id=user_id, session_id=session_id
            )
            if session is None:
                session = await self._session_service.create_session(
                    app_name="hazela", user_id=user_id, session_id=session_id, state={}
                )

            user_content = Content(role="user", parts=[Part(text=message)])

            actions_log = []
            final_text = ""

            async for event in self._runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=user_content,
            ):
                if hasattr(event, "is_final_response") and event.is_final_response():
                    if event.content and event.content.parts:
                        final_text = event.content.parts[0].text or ""
                elif hasattr(event, "tool_call"):
                    actions_log.append({
                        "tool_name": getattr(event.tool_call, "name", "unknown"),
                        "input_summary": str(getattr(event.tool_call, "args", {}))[:200],
                        "output_summary": "",
                    })

            return {
                "session_id": session_id,
                "response_text": final_text,
                "actions": actions_log,
                "status_update": None,
                "suggested_next_steps": [],
            }

        except Exception as exc:
            logger.error("ADK run failed: %s", exc, exc_info=True)
            return {
                "session_id": session_id,
                "response_text": f"I encountered an error processing your request. Please try again. (Error: {exc})",
                "actions": [],
                "status_update": None,
                "suggested_next_steps": [],
            }

    async def _run_mock(
        self,
        user_id: str,
        message: str,
        session_id: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute via the mock orchestrator when ADK Runner is unavailable."""
        result = await self._orchestrator.run_async(
            user_id=user_id,
            message=message,
            session_id=session_id,
            **context,
        )
        return {
            "session_id": session_id,
            "response_text": result.get("response_text", ""),
            "actions": result.get("actions", []),
            "status_update": result.get("status_update"),
            "suggested_next_steps": [],
        }


# Singleton — imported by dependencies.py
hazela_runner = HazelaRunner()
