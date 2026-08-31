"""
Legitimacy Agent — verifies whether a scheme is genuine.

Architecture principle (from AGENTS.md):
  "Gemini alone never proves legitimacy — it explains/summarises; the rules decide."

Execution order:
  1. apply_legitimacy_rules() → deterministic verdict (suspicious/warning/legitimate)
  2. LlmAgent (Gemini) → user-friendly explanation of the verdict
  3. Return combined result with sources always preserved

The Gemini call is for EXPLANATION ONLY. It cannot override the rule-based verdict.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from app.config import settings

logger = logging.getLogger(__name__)

LEGITIMACY_SYSTEM_PROMPT = """
You are the Iva Legitimacy Agent, a specialist in identifying fraudulent government scheme scams.

A deterministic rule engine has already evaluated the scheme and produced a verdict.
Your ONLY job is to explain this verdict clearly to the user in plain, simple language.

## Rules you must follow
- NEVER contradict or override the verdict produced by the rule engine.
- NEVER claim a scheme is legitimate if the verdict is "suspicious" or "warning".
- ALWAYS include the sources used in your explanation.
- ALWAYS tell the user exactly where they can verify — give them the specific official URL.
- If verdict is "suspicious": be direct. Tell them not to proceed and why.
- If verdict is "warning": be cautious. Explain what to verify before proceeding.
- If verdict is "legitimate": confirm it with the evidence, but remind them to always use the official URL.
- Keep your response under 200 words — be direct, not verbose.

## Your input
You will receive a structured verdict with: overall_verdict, risk_level, findings, sources, recommendation.
Explain this to the user as if they are a first-time internet user applying for a government scheme.
""".strip()


def create_legitimacy_agent(model_name: str | None = None):
    """
    Create and return a configured ADK LlmAgent for legitimacy checking.
    Returns a mock agent if Gemini is not configured.

    Args:
        model_name: Gemini model to use. Defaults to settings.gemini_model.
                    Pass an explicit model during failover so all agents
                    in the graph use the same fallback model.
    """
    from agents.tools.legitimacy_tools import (
        apply_legitimacy_rules, check_domain_legitimacy, check_scheme_in_registry,
        verify_scheme_provenance, verify_user_url,
    )

    tools = [apply_legitimacy_rules, check_domain_legitimacy, check_scheme_in_registry,
             verify_scheme_provenance, verify_user_url]

    selected_model = model_name or settings.gemini_model

    if not settings.gemini_enabled:
        logger.warning("Gemini not configured — Legitimacy Agent will use mock mode.")
        return _MockLegitimacyAgent(tools)

    try:
        from google.adk.agents import LlmAgent  # type: ignore
        agent = LlmAgent(
            name="legitimacy_agent",
            model=selected_model,
            description=(
                "Verifies whether a government scheme is legitimate using deterministic rules "
                "(domain check, fee check, registry check). Gemini explains; rules decide."
            ),
            instruction=LEGITIMACY_SYSTEM_PROMPT,
            tools=tools,
        )
        logger.info("Legitimacy Agent created (model=%s)", selected_model)
        return agent
    except Exception as exc:
        logger.error("Failed to create Legitimacy Agent: %s — using mock.", exc)
        return _MockLegitimacyAgent(tools)


class _MockLegitimacyAgent:
    """Stub used when Gemini API key is absent."""

    name = "legitimacy_agent"

    def __init__(self, tools: list) -> None:
        self._tools = {t.__name__: t for t in tools}

    async def run_async(self, *, scheme_name: str = "", url: str = "", description: str = "", **_: Any) -> Dict[str, Any]:
        from agents.tools.legitimacy_tools import apply_legitimacy_rules
        verdict = await apply_legitimacy_rules(scheme_name, url or "https://example.com", description)
        return {
            "response_text": (
                f"[MOCK Legitimacy Agent] Verdict for '{scheme_name}': "
                f"{verdict['overall_verdict'].upper()} (risk: {verdict['risk_level']}). "
                f"{verdict['recommendation']} (Enable GEMINI_API_KEY for full explanation.)"
            ),
            "verdict": verdict,
            "actions": [{"tool_name": "apply_legitimacy_rules", "input_summary": scheme_name, "output_summary": verdict["overall_verdict"]}],
            "status_update": None,
        }
