"""
Model Provider — Gemini + Grok failover layer.

Architecture:
    PRIMARY:  Gemini 3.6 Flash
    FALLBACK: Gemini 3.1 Flash Lite → Gemini 3.5 Flash Lite → ...
    GROK:     xAI Grok (external fallback when all Gemini models fail)

Failover triggers:
    - 429 RESOURCE_EXHAUSTED
    - rate limit / quota exceeded
    - temporary unavailability

Failover does NOT trigger for:
    - invalid user input
    - tool errors
    - application validation errors
    - programming bugs

The rest of Hazela (Agent Core, tools, session) remains unchanged.
Only the model selection and retry logic lives here.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _is_retryable_provider_error(exc: Exception) -> bool:
    """
    Determine whether an exception represents a retryable provider/quota error.
    
    Returns True only for provider-level failures (429, quota, rate limit,
    temporary unavailability). Returns False for input errors, tool errors,
    validation errors, and programming bugs.
    """
    exc_str = str(exc).lower()
    # 429 / quota / rate limit patterns
    retryable_patterns = [
        "429",
        "resource_exhausted",
        "rate limit",
        "quota",
        "too many requests",
        "temporarily unavailable",
        "service unavailable",
        "overloaded",
        "capacity",
    ]
    return any(pattern in exc_str for pattern in retryable_patterns)


class ModelProvider:
    """
    Manages the Gemini → Grok failover chain.
    
    Usage:
        provider = ModelProvider()
        result = await provider.run_with_fallback(
            runner_fn=some_runner_function,
            session_args={...},
        )
    
    The runner_fn is called with the current primary model.
    If it fails with a retryable error, the next model is tried.
    """
    
    def __init__(self) -> None:
        self._gemini_primary = settings.gemini_model
        self._gemini_fallbacks = settings.gemini_fallback_list
        self._grok_enabled = settings.grok_enabled
        self._grok_model = settings.grok_model
        self._current_model = self._gemini_primary
    
    @property
    def current_model(self) -> str:
        """Return the currently active model name."""
        return self._current_model
    
    def get_model_chain(self) -> List[Dict[str, str]]:
        """
        Return the full model chain for display/logging.
        Each entry has 'provider' and 'model' keys.
        """
        chain = [{"provider": "gemini", "model": self._gemini_primary}]
        for m in self._gemini_fallbacks:
            chain.append({"provider": "gemini", "model": m})
        if self._grok_enabled:
            chain.append({"provider": "grok", "model": self._grok_model})
        return chain
    
    def reset(self) -> None:
        """Reset to the primary model after a successful call."""
        self._current_model = self._gemini_primary
    
    async def run_with_fallback(
        self,
        runner_fn: Any,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Attempt to run the agent with the current model chain.
        
        Args:
            runner_fn: Async callable that takes a model_name parameter.
            **kwargs: Additional arguments passed to runner_fn.
        
        Returns:
            The result dict from the successful runner_fn call,
            or the last error if all providers fail.
        
        The function signature for runner_fn should be:
            async def runner_fn(model_name: str, **kwargs) -> dict
        """
        errors = []
        
        # Try primary + Gemini fallbacks
        all_models = [self._gemini_primary] + self._gemini_fallbacks
        
        for model in all_models:
            try:
                logger.info("Attempting model provider=gemini model=%s", model)
                result = await runner_fn(model_name=model, **kwargs)
                self._current_model = model
                logger.info("Success with model provider=gemini model=%s", model)
                return result
            except Exception as exc:
                if _is_retryable_provider_error(exc):
                    logger.warning(
                        "Model %s failed (retryable): %s — trying next fallback",
                        model, exc,
                    )
                    errors.append({"provider": "gemini", "model": model, "error": str(exc)})
                    continue
                else:
                    # Non-retryable error — don't switch models, re-raise
                    logger.error("Non-retryable error with model %s: %s", model, exc)
                    raise
        
        # All Gemini models exhausted — try Grok if enabled
        if self._grok_enabled and settings.xai_api_key:
            try:
                logger.info(
                    "All Gemini models exhausted — falling back provider=grok model=%s",
                    self._grok_model,
                )
                result = await runner_fn(model_name=self._grok_model, **kwargs)
                self._current_model = self._grok_model
                logger.info("Success with Grok model=%s", self._grok_model)
                return result
            except Exception as exc:
                errors.append({"provider": "grok", "model": self._grok_model, "error": str(exc)})
                logger.error("Grok fallback also failed: %s", exc)
        elif self._grok_enabled and not settings.xai_api_key:
            logger.warning("Grok fallback enabled but XAI_API_KEY not set")
        
        # All providers exhausted
        last_error = errors[-1]["error"] if errors else "All model providers failed"
        return {
            "session_id": kwargs.get("session_id", ""),
            "response_text": "I'm experiencing high demand right now. Please try again in a moment.",
            "actions": [],
            "status_update": None,
            "suggested_next_steps": [],
            "_provider_errors": errors,
        }


# Singleton
model_provider = ModelProvider()
