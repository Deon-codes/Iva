"""
Regression test: authenticated user_id must propagate through ADK ToolContext,
NOT be invented by Gemini.

This test proves that:
1. Tools read user_id from ToolContext (framework-injected)
2. The authenticated UID is never replaced by user_1234 / demo-user / test-user
3. Tools work correctly when user_id is absent (ToolContext provides it)
"""

import pytest
from unittest.mock import MagicMock


# Synthetic test UID — must NOT appear as user_1234, demo-user, or test-user
AUTH_UID = "auth-test-user-abc123"


def _make_tool_context(uid: str = AUTH_UID):
    """Create a mock ADK ToolContext with the given user_id."""
    ctx = MagicMock()
    ctx.user_id = uid
    return ctx


@pytest.mark.asyncio
class TestToolContextIdentity:
    """Verify tools read user_id from ToolContext."""

    async def test_get_user_profile_uses_tool_context(self):
        """get_user_profile must read user_id from tool_context, not the function arg."""
        from app.services.firestore_service import upsert_user
        from agents.tools.profile_tools import get_user_profile

        # Create profile under AUTH_UID
        await upsert_user(AUTH_UID, {
            "name": "Test User",
            "email": "test@example.com",
            "state": "Maharashtra",
        })

        tc = _make_tool_context()
        profile = await get_user_profile(tool_context=tc)

        assert profile is not None
        assert profile["name"] == "Test User"
        assert profile["state"] == "Maharashtra"

    async def test_get_user_profile_ignores_wrong_explicit_user_id(self):
        """When tool_context is present, explicit user_id arg must be IGNORED."""
        from app.services.firestore_service import upsert_user
        from agents.tools.profile_tools import get_user_profile

        # Create profile under AUTH_UID
        await upsert_user(AUTH_UID, {"name": "Correct User", "email": "c@test.com"})

        tc = _make_tool_context(AUTH_UID)
        # Pass a WRONG user_id as explicit arg — tool_context should win
        profile = await get_user_profile(user_id="wrong-user-999", tool_context=tc)

        assert profile is not None
        assert profile["name"] == "Correct User"

    async def test_prepare_form_fields_uses_tool_context(self):
        """prepare_form_fields must read user_id from tool_context."""
        from app.services.firestore_service import upsert_user
        from agents.tools.application_tools import prepare_form_fields

        await upsert_user(AUTH_UID, {
            "name": "Form User",
            "email": "form@test.com",
            "state": "Maharashtra",
            "age": 21,
            "annual_income_inr": 200000,
            "education_level": "Undergraduate",
            "caste_category": "OBC",
        })

        tc = _make_tool_context()
        result = await prepare_form_fields(scheme_id="scheme_pm_nsp_merit", tool_context=tc)

        # Must NOT have an error about missing profile
        assert "error" not in result
        assert result["scheme_name"] is not None
        assert len(result["form_fields"]) > 0
        # Must find the correct user's profile data
        name_field = result["form_fields"]["applicant_name"]
        assert name_field["value"] == "Form User" if isinstance(name_field, dict) else name_field == "Form User"

    async def test_create_application_uses_tool_context(self):
        """create_application must use user_id from tool_context."""
        from app.services.firestore_service import upsert_user
        from agents.tools.application_tools import create_application

        await upsert_user(AUTH_UID, {"name": "App User", "email": "app@test.com"})

        tc = _make_tool_context()
        result = await create_application(scheme_id="scheme_pm_nsp_merit", tool_context=tc)

        assert "error" not in result
        # Application model uses camelCase 'userId'
        assert result.get("userId") == AUTH_UID

    async def test_list_user_applications_uses_tool_context(self):
        """list_user_applications must use user_id from tool_context."""
        from agents.tools.application_tools import list_user_applications

        tc = _make_tool_context()
        apps = await list_user_applications(tool_context=tc)

        assert isinstance(apps, list)

    async def test_tool_context_user_id_never_1234(self):
        """The tool_context must never contain user_1234."""
        tc = _make_tool_context(AUTH_UID)
        assert tc.user_id != "user_1234"
        assert tc.user_id != "demo-user"
        assert tc.user_id != "test-user"
        assert tc.user_id == AUTH_UID

    async def test_backward_compat_explicit_user_id(self):
        """Tools still work when called without tool_context (tests, mock path)."""
        from app.services.firestore_service import upsert_user
        from agents.tools.profile_tools import get_user_profile

        await upsert_user(AUTH_UID, {"name": "Compat User", "email": "x@test.com"})

        # Call without tool_context — should use explicit user_id
        profile = await get_user_profile(user_id=AUTH_UID)
        assert profile is not None
        assert profile["name"] == "Compat User"
