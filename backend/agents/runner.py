"""
ADK Runner — initialises the ADK session service and Runner, exposes run_agent().

This is the single entry point the FastAPI routes call.
Manages ADK session state per (user_id, session_id) pair.

Includes model failover: Gemini primary → Gemini fallbacks → Grok (external).
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _is_retryable_error(exc: Exception) -> bool:
    """Check if an exception represents a retryable provider/quota error."""
    exc_str = str(exc).lower()
    retryable = [
        "429", "resource_exhausted", "rate limit", "quota",
        "too many requests", "temporarily unavailable", "overloaded",
    ]
    return any(p in exc_str for p in retryable)


class IvaRunner:
    """
    Wraps the Google ADK Runner with session management.
    Constructed once at app startup and shared across requests.
    """

    def __init__(self) -> None:
        self._runner: Any = None
        self._session_service: Any = None
        self._orchestrator: Any = None
        self._initialised = False
        self._current_model: str = settings.gemini_model

    def initialise(self) -> None:
        """Build agents and ADK runner. Called during FastAPI lifespan startup."""
        self._build_orchestrator(self._current_model)
        self._initialised = True

    def _build_orchestrator(self, model_name: str) -> None:
        """Build or rebuild the orchestrator + ADK runner with a specific model."""
        from agents.discovery_agent import create_discovery_agent
        from agents.legitimacy_agent import create_legitimacy_agent
        from agents.form_prep_agent import create_form_prep_agent
        from agents.orchestrator import create_orchestrator_with_model

        discovery = create_discovery_agent(model_name)
        legitimacy = create_legitimacy_agent(model_name)
        form_prep = create_form_prep_agent(model_name)
        self._orchestrator = create_orchestrator_with_model(
            discovery, legitimacy, form_prep, model_name
        )

        if settings.gemini_enabled:
            try:
                from google.adk.runners import Runner  # type: ignore
                from google.adk.sessions import InMemorySessionService  # type: ignore

                if self._session_service is None:
                    self._session_service = InMemorySessionService()

                self._runner = Runner(
                    agent=self._orchestrator,
                    app_name="iva",
                    session_service=self._session_service,
                )
                logger.info("ADK Runner initialised with model=%s", model_name)
            except Exception as exc:
                logger.error("ADK Runner init failed: %s — falling back to mock runner.", exc)
                self._runner = None
        else:
            logger.info("ADK Runner in mock mode (no GEMINI_API_KEY).")

        self._current_model = model_name

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
            return await self._run_with_adk_fallback(
                user_id, message, session_id, context or {}
            )
        else:
            return await self._run_mock(user_id, message, session_id, context or {})

    async def _run_with_adk_fallback(
        self,
        user_id: str,
        message: str,
        session_id: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute via ADK with model failover on retryable errors."""
        # Build the model chain
        gemini_fallbacks = settings.gemini_fallback_list
        all_gemini = [settings.gemini_model] + gemini_fallbacks
        grok_enabled = settings.grok_enabled and bool(settings.xai_api_key)

        errors = []

        # Try each Gemini model
        for model in all_gemini:
            if model != self._current_model:
                logger.info("Switching to model %s", model)
                self._build_orchestrator(model)

            try:
                result = await self._run_with_adk(user_id, message, session_id, context)
                # Reset to primary on success
                if self._current_model != settings.gemini_model:
                    logger.info("Model %s succeeded — will use for subsequent calls until reset", model)
                return result
            except Exception as exc:
                if _is_retryable_error(exc):
                    logger.warning(
                        "Model %s hit retryable error: %s — trying next fallback",
                        model, exc,
                    )
                    errors.append({"provider": "gemini", "model": model, "error": str(exc)})
                    continue
                else:
                    # Non-retryable error — return as-is, don't switch models
                    logger.error("Non-retryable error with model %s: %s", model, exc)
                    return {
                        "session_id": session_id,
                        "response_text": "I encountered an error processing your request. Please try again.",
                        "actions": [],
                        "status_update": None,
                        "suggested_next_steps": [],
                    }

        # Try Grok fallback
        if grok_enabled:
            try:
                logger.info(
                    "All Gemini models exhausted — trying Grok model=%s",
                    settings.grok_model,
                )
                # Note: Grok doesn't have ADK integration — it can't call tools.
                # This is a text-only fallback for conversational responses.
                result = await self._run_grok_fallback(
                    user_id, message, session_id, context
                )
                return result
            except Exception as exc:
                errors.append({"provider": "grok", "model": settings.grok_model, "error": str(exc)})
                logger.error("Grok fallback failed: %s", exc)

        # All providers exhausted
        logger.error("All model providers exhausted: %s", errors)
        # Reset to primary for next request
        self._build_orchestrator(settings.gemini_model)
        return {
            "session_id": session_id,
            "response_text": "I'm experiencing high demand right now. Please try again in a moment.",
            "actions": [],
            "status_update": None,
            "suggested_next_steps": [],
        }

    async def _run_grok_fallback(
        self,
        user_id: str,
        message: str,
        session_id: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Run a text-only Grok fallback when all Gemini models are exhausted.
        
        IMPORTANT LIMITATION: Grok does NOT support Google ADK tool calling.
        This provides a conversational text response only — no scheme search,
        eligibility checks, or application preparation.
        """
        try:
            import httpx

            headers = {
                "Authorization": f"Bearer {settings.xai_api_key}",
                "Content-Type": "application/json",
            }

            # Build a system prompt for Grok
            system_prompt = (
                "You are Iva, an AI assistant that helps Indian citizens discover "
                "government schemes and scholarships. You are currently operating in "
                "limited mode without access to the full scheme database. "
                "Provide helpful general guidance about Indian government scholarships "
                "and ask the user to try again shortly for personalized results."
            )

            payload = {
                "model": settings.grok_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "temperature": 0.7,
                "max_tokens": 1024,
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()

            response_text = data["choices"][0]["message"]["content"]

            return {
                "session_id": session_id,
                "response_text": response_text,
                "actions": [],
                "status_update": None,
                "suggested_next_steps": [],
            }
        except Exception as exc:
            logger.error("Grok API call failed: %s", exc)
            raise

    async def _run_with_adk(
        self,
        user_id: str,
        message: str,
        session_id: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute via the real ADK Runner (may raise on 429)."""
        from google.adk.sessions import Session  # type: ignore
        from google.genai.types import Content, Part  # type: ignore

        # Ensure session exists
        session = await self._session_service.get_session(
            app_name="iva", user_id=user_id, session_id=session_id
        )
        if session is None:
            session = await self._session_service.create_session(
                app_name="iva", user_id=user_id, session_id=session_id, state={}
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
iva_runner = IvaRunner()
