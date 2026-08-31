"""
Discovery Agent — finds and evaluates scheme eligibility for a user.

Uses Google ADK LlmAgent with Gemini 2.0 Flash.
Tools: search_schemes, get_scheme_details, check_eligibility, get_user_profile, get_profile_completeness.

The agent reasons over the 3-scheme RAG corpus to answer:
  "Which government scholarships can I apply for?"
It calls check_eligibility deterministically, then lets Gemini explain the result.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from app.config import settings

logger = logging.getLogger(__name__)

DISCOVERY_SYSTEM_PROMPT = """
You are the Iva Discovery Agent, an expert in Indian government scholarships and welfare schemes.

Your role is to help users discover which government schemes and scholarships they are eligible for,
based on their personal profile (state, income, caste category, gender, education level, etc.).

## How you work
1. If the user profile is incomplete, ask for the missing information needed for eligibility checks.
2. Use the `search_schemes` tool to find relevant schemes from the verified database.
3. Use `check_eligibility` to deterministically evaluate each scheme against the user's profile.
4. Use `get_scheme_details` to retrieve full scheme information when needed.
5. Present results clearly: which schemes the user IS eligible for, which they are NOT, and why.

## Rules you must follow
- NEVER invent scheme information. Only use data returned by your tools.
- NEVER claim a user is eligible unless `check_eligibility` returned eligible=True.
- Always mention the official URL for any scheme you recommend.
- If profile information is missing, list what's needed before running eligibility checks.
- Be concise, clear, and empathetic — many users are first-time applicants unfamiliar with bureaucracy.
- If the user asks about a scheme not in your database, honestly say so and direct them to myScheme.gov.in.

## Scope
You only handle: scheme discovery, eligibility evaluation, required documents listing.
You do NOT verify legitimacy (that is the Legitimacy Agent's job).
You do NOT prepare or submit forms (that is the Form-Preparation Agent's job).
""".strip()


def create_discovery_agent(model_name: str | None = None):
    """
    Create and return a configured ADK LlmAgent for scheme discovery.
    Returns a mock agent if Gemini is not configured.

    Args:
        model_name: Gemini model to use. Defaults to settings.gemini_model.
                    Pass an explicit model during failover so all agents
                    in the graph use the same fallback model.
    """
    from agents.tools.scheme_tools import search_schemes, get_scheme_details, check_eligibility
    from agents.tools.profile_tools import get_user_profile, get_profile_completeness

    tools = [search_schemes, get_scheme_details, check_eligibility,
             get_user_profile, get_profile_completeness]

    selected_model = model_name or settings.gemini_model

    if not settings.gemini_enabled:
        logger.warning("Gemini not configured — Discovery Agent will use mock mode.")
        return _MockDiscoveryAgent(tools)

    try:
        from google.adk.agents import LlmAgent  # type: ignore
        agent = LlmAgent(
            name="discovery_agent",
            model=selected_model,
            description=(
                "Discovers government schemes and scholarships the user is eligible for, "
                "based on their profile. Performs deterministic eligibility checks."
            ),
            instruction=DISCOVERY_SYSTEM_PROMPT,
            tools=tools,
        )
        logger.info("Discovery Agent created (model=%s)", selected_model)
        return agent
    except Exception as exc:
        logger.error("Failed to create Discovery Agent: %s — using mock.", exc)
        return _MockDiscoveryAgent(tools)


class _MockDiscoveryAgent:
    """Stub used when Gemini API key is absent (local dev / CI)."""

    name = "discovery_agent"

    def __init__(self, tools: list) -> None:
        self._tools = {t.__name__: t for t in tools}

    async def run_async(self, *, user_id: str = "", message: str = "", **_: Any) -> Dict[str, Any]:
        import asyncio
        from agents.tools.scheme_tools import search_schemes

        schemes = await search_schemes(message)
        scheme_names = [s["name"] for s in schemes[:3]]
        return {
            "response_text": (
                f"[MOCK Discovery Agent] Found {len(schemes)} potentially relevant schemes: "
                + ", ".join(scheme_names)
                + ". (Enable GEMINI_API_KEY for real eligibility reasoning.)"
            ),
            "actions": [{"tool_name": "search_schemes", "input_summary": message, "output_summary": str(scheme_names)}],
            "status_update": None,
        }
