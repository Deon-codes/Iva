"""
Form-Preparation Agent — maps user profile + documents to scheme form fields
and fills the mock government portal. Hard stops before OTP/submission.

From AGENTS.md:
  1. Determine required fields
  2. Read the user's saved profile
  3. Read available document metadata
  4. Map information to application fields
  5. Prepare the application
  6. Fill the hackathon's mock government portal
  7. Present the completed form for review

  HARD STOP before: OTP / identity verification / final submission.
  "We respect identity verification by design, not a limitation."
"""

from __future__ import annotations

import logging
from typing import Any, Dict

from app.config import settings

logger = logging.getLogger(__name__)

FORM_PREP_SYSTEM_PROMPT = """
You are the Iva Form-Preparation Agent, a specialist in preparing scholarship application forms.

CRITICAL: The authenticated user's identity is injected automatically into every tool call.
You do NOT need to pass user_id as an argument. The tools read it from the trusted
session context. NEVER ask the user for their User ID.

Your job is to:
1. Retrieve the user's profile using `get_user_profile()` — user identity is automatic.
2. Use `prepare_form_fields(scheme_id=scheme_id)` to map profile data to the scheme's required fields.
3. Call `create_application(scheme_id=scheme_id)` to register the application in DRAFT status.
4. Use `fill_mock_portal` to populate the mock government portal form.
5. Present the completed form to the user for review.

All tools automatically receive the user identity from the session. Just pass scheme_id.

## Hard stop rules (MANDATORY — never violate these)
- NEVER proceed past the form review step.
- NEVER attempt to submit the form to any real government website.
- NEVER bypass or simulate OTP / Aadhaar identity verification / CAPTCHA.
- When you reach the review step, ALWAYS tell the user:
  "Please review this form carefully. When you are ready, you will need to submit it
   yourself on the official portal after completing identity verification."
- Frame the hard stop positively: "We prepare the form so you don't have to,
  but identity verification is your right to control."

## Missing information
- If required profile fields are missing, list them clearly and ask the user to update their profile.
- If required documents are missing, list them and tell the user what to upload.
- Do NOT guess or fill in incorrect information.

## Output
Always return a structured summary with: scheme name, form fields filled, missing items,
next steps, and the mock portal session URL.
""".strip()


def create_form_prep_agent(model_name: str | None = None):
    """
    Create and return a configured ADK LlmAgent for form preparation.
    Returns a mock agent if Gemini is not configured.

    Args:
        model_name: Gemini model to use. Defaults to settings.gemini_model.
                    Pass an explicit model during failover so all agents
                    in the graph use the same fallback model.
    """
    from agents.tools.profile_tools import get_user_profile
    from agents.tools.application_tools import create_application, prepare_form_fields
    from agents.mock_portal.portal import fill_mock_portal

    tools = [get_user_profile, prepare_form_fields, create_application, fill_mock_portal]

    selected_model = model_name or settings.gemini_model

    if not settings.gemini_enabled:
        logger.warning("Gemini not configured — Form-Prep Agent will use mock mode.")
        return _MockFormPrepAgent(tools)

    try:
        from google.adk.agents import LlmAgent  # type: ignore
        agent = LlmAgent(
            name="form_prep_agent",
            model=selected_model,
            description=(
                "Prepares scholarship application forms by mapping the user's profile "
                "and documents to required fields. Hard stop before OTP/submission."
            ),
            instruction=FORM_PREP_SYSTEM_PROMPT,
            tools=tools,
        )
        logger.info("Form-Prep Agent created (model=%s)", selected_model)
        return agent
    except Exception as exc:
        logger.error("Failed to create Form-Prep Agent: %s — using mock.", exc)
        return _MockFormPrepAgent(tools)


class _MockFormPrepAgent:
    """Stub used when Gemini API key is absent."""

    name = "form_prep_agent"

    def __init__(self, tools: list) -> None:
        self._tools = {t.__name__: t for t in tools}

    async def run_async(self, *, user_id: str = "", scheme_id: str = "", **_: Any) -> Dict[str, Any]:
        from agents.tools.application_tools import prepare_form_fields
        from agents.mock_portal.portal import fill_mock_portal

        form_result = await prepare_form_fields(user_id, scheme_id)
        if "error" in form_result:
            return {
                "response_text": f"[MOCK Form-Prep Agent] Error: {form_result['error']}",
                "actions": [],
                "status_update": None,
            }

        portal_result = await fill_mock_portal(user_id, scheme_id, form_result["form_fields"])
        return {
            "response_text": (
                f"[MOCK Form-Prep Agent] Form prepared for '{form_result['scheme_name']}'. "
                f"{'Ready for review.' if form_result['ready_to_submit'] else 'Missing: ' + str(form_result.get('missing_fields', []))} "
                f"Mock portal session: {portal_result.get('session_id')}. "
                "(Enable GEMINI_API_KEY for full form-preparation guidance.)"
            ),
            "form_result": form_result,
            "portal_result": portal_result,
            "actions": [
                {"tool_name": "prepare_form_fields", "input_summary": f"{user_id}/{scheme_id}", "output_summary": str(form_result["ready_to_submit"])},
                {"tool_name": "fill_mock_portal", "input_summary": scheme_id, "output_summary": portal_result.get("session_id", "")},
            ],
            "status_update": "action_required" if not form_result["ready_to_submit"] else None,
        }
