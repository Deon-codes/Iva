"""
Orchestrator — root ADK LlmAgent that routes user requests to the correct sub-agent.

Architecture (from AGENTS.md):
  User → ADK Orchestrator → { Discovery Agent, Legitimacy Agent, Form-Preparation Agent }
       → Tools / Services → Firestore / approved external sources

The orchestrator uses Gemini 2.0 Flash to reason about user intent and delegate.
It does NOT use hardcoded if/else routing — Gemini decides based on context.
Sub-agents are exposed as tools via AgentTool so the orchestrator can call them.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from app.config import settings

logger = logging.getLogger(__name__)

ORCHESTRATOR_SYSTEM_PROMPT = """
You are Hazela, an AI assistant that helps Indian citizens discover, verify, and apply for
government schemes and scholarships. You are the central coordinator.

You have three specialist agents available as tools:
- **discovery_agent**: Finds relevant schemes and checks eligibility based on user profile.
- **legitimacy_agent**: Verifies whether a scheme is genuine (not a scam).
- **form_prep_agent**: Prepares application forms and fills the mock portal. Stops before OTP.

## Important: User Identity
The authenticated user's identity is injected automatically into every tool call.
You do NOT need to pass user_id as an argument — the tools read it from the
trusted session context. Simply call tools without worrying about user identity.
NEVER ask the user for their User ID.

## How to route requests
- "Which scholarships can I get?" / "Am I eligible for X?" → discovery_agent
- "Is this scheme real/legitimate?" / "Is this a scam?" → legitimacy_agent
- "Apply for me" / "Fill my form" / "Prepare my application" → form_prep_agent
- "What's the status of my application for <scheme>?" → check_application_status(scheme_id=...)
- "Check my application status" → check_application_status to list user's applications
- Profile questions → answer directly or call get_user_profile

When calling check_application_status: pass scheme_id if the user mentions a scheme name, NOT application_id.
The tool resolves the scheme to the correct application automatically.
User identity is injected by the framework — do NOT pass user_id.

## Chaining (the agentic workflow)
For the full end-to-end flow, chain naturally:
1. discovery_agent → finds eligible schemes
2. legitimacy_agent → verifies the chosen scheme
3. form_prep_agent → prepares the form (if user wants to proceed)

## Rules
- NEVER invent government scheme facts. Only use tool outputs.
- NEVER bypass OTP, CAPTCHA, or identity verification — ever.
- NEVER ask the user for their User ID — it is already available internally.
- ALWAYS surface the source/reference when giving legitimacy results.
- Be clear, warm, and accessible. Many users are first-time applicants.
- If something is outside your scope (e.g., tax filing, passport), say so politely.
- Respond in the same language the user writes in (Hindi or English).

## Context
You are working in the context of the Google All Things Agentic Hackathon.
Today's platform supports: PM NSP scholarship, Maharashtra Rajarshi Shahu scholarship,
and AICTE Pragati scholarship for girl students in technical education.
""".strip()


def create_orchestrator(discovery_agent: Any, legitimacy_agent: Any, form_prep_agent: Any) -> Any:
    """
    Create the root orchestrator LlmAgent with sub-agents as AgentTools.
    Falls back to a mock orchestrator if Gemini is unavailable.
    """
    return create_orchestrator_with_model(
        discovery_agent, legitimacy_agent, form_prep_agent, settings.gemini_model
    )


def create_orchestrator_with_model(
    discovery_agent: Any,
    legitimacy_agent: Any,
    form_prep_agent: Any,
    model_name: str,
) -> Any:
    """
    Create the root orchestrator with an explicit model name.
    Used for model failover — when the primary model hits 429,
    the runner rebuilds the orchestrator with a fallback model.
    Falls back to a mock orchestrator if the model is unavailable.
    """
    from agents.tools.status_tools import check_application_status
    from agents.tools.profile_tools import get_user_profile
    from agents.tools.scheme_tools import check_eligibility_for_user

    if not settings.gemini_enabled:
        logger.warning("Gemini not configured — Orchestrator will use mock mode.")
        return _MockOrchestrator(discovery_agent, legitimacy_agent, form_prep_agent)

    try:
        from google.adk.agents import LlmAgent  # type: ignore
        from google.adk.tools import agent_tool  # type: ignore

        # Wrap sub-agents as callable tools
        discovery_tool = agent_tool.AgentTool(agent=discovery_agent)
        legitimacy_tool = agent_tool.AgentTool(agent=legitimacy_agent)
        form_prep_tool = agent_tool.AgentTool(agent=form_prep_agent)

        orchestrator = LlmAgent(
            name="hazela_orchestrator",
            model=model_name,
            description="Central orchestrator for Hazela — routes user requests to Discovery, Legitimacy, or Form-Prep agents.",
            instruction=ORCHESTRATOR_SYSTEM_PROMPT,
            tools=[
                discovery_tool,
                legitimacy_tool,
                form_prep_tool,
                check_application_status,
                get_user_profile,
                check_eligibility_for_user,
            ],
        )
        logger.info("Orchestrator created (model=%s)", model_name)
        return orchestrator
    except Exception as exc:
        logger.error("Failed to create Orchestrator with model %s: %s — using mock.", model_name, exc)
        return _MockOrchestrator(discovery_agent, legitimacy_agent, form_prep_agent)


class _MockOrchestrator:
    """
    Mock orchestrator for when Gemini is not configured.
    Routes by simple keyword heuristic so tests still exercise the full pipeline.
    """

    name = "hazela_orchestrator"

    def __init__(self, discovery_agent: Any, legitimacy_agent: Any, form_prep_agent: Any) -> None:
        self.discovery = discovery_agent
        self.legitimacy = legitimacy_agent
        self.form_prep = form_prep_agent

    async def run_async(self, *, user_id: str, message: str, **kwargs: Any) -> Dict[str, Any]:
        msg_lower = message.lower()

        if any(kw in msg_lower for kw in ("legitim", "scam", "real", "genuine", "verify")):
            result = await self.legitimacy.run_async(
                scheme_name=message, url="https://scholarships.gov.in", description=message, user_id=user_id
            )
        elif any(kw in msg_lower for kw in ("apply", "form", "fill", "prepare")):
            # Extract scheme_id from context or default to first scheme
            scheme_id = kwargs.get("scheme_id", "scheme_pm_nsp_merit")
            result = await self.form_prep.run_async(user_id=user_id, scheme_id=scheme_id)
        else:
            result = await self.discovery.run_async(user_id=user_id, message=message)

        return result
