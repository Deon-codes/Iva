"""
Tests for check_application_status scheme-to-application resolution.

Verifies that:
1. Direct application_id lookup still works
2. scheme_id resolves to user's application
3. Missing application returns clean not-found
4. User isolation is enforced
5. No fabricated status explanations
"""

import pytest
from unittest.mock import MagicMock


AUTH_UID = "status-test-user-456"
OTHER_UID = "other-user-789"


def _tc(uid: str = AUTH_UID):
    ctx = MagicMock()
    ctx.user_id = uid
    return ctx


@pytest.mark.asyncio
class TestStatusResolution:

    async def test_direct_application_id(self):
        """Direct application_id lookup works as before."""
        from app.services.firestore_service import upsert_user, create_application
        from agents.tools.status_tools import check_application_status

        await upsert_user(AUTH_UID, {"name": "Status User", "email": "s@test.com"})
        app = await create_application(AUTH_UID, "scheme_pm_nsp_merit")
        app_id = app["id"]

        result = await check_application_status(application_id=app_id, tool_context=_tc())

        assert result.get("found") is True
        assert result["application_id"] == app_id
        assert result["status"] == "draft"

    async def test_scheme_id_resolves_application(self):
        """scheme_id resolves to the correct user application."""
        from app.services.firestore_service import upsert_user, create_application
        from agents.tools.status_tools import check_application_status

        await upsert_user(AUTH_UID, {"name": "Scheme User", "email": "su@test.com"})
        app = await create_application(AUTH_UID, "scheme_pm_nsp_merit")

        result = await check_application_status(
            scheme_id="scheme_pm_nsp_merit", tool_context=_tc()
        )

        assert result.get("found") is True
        assert result["application_id"] == app["id"]
        assert result["scheme_id"] == "scheme_pm_nsp_merit"
        assert result["status"] == "draft"

    async def test_no_application_returns_clean_not_found(self):
        """When no application exists for scheme, return clean message."""
        from app.services.firestore_service import upsert_user
        from agents.tools.status_tools import check_application_status

        await upsert_user(AUTH_UID, {"name": "No App User", "email": "na@test.com"})

        result = await check_application_status(
            scheme_id="scheme_nonexistent", tool_context=_tc()
        )

        assert result.get("found") is False
        assert "No application" in result.get("message", "")
        # Must NOT invent a status
        assert "under review" not in result.get("message", "").lower()
        assert "approved" not in result.get("message", "").lower()

    async def test_no_params_returns_helpful_message(self):
        """No application_id or scheme_id → helpful response."""
        from agents.tools.status_tools import check_application_status

        result = await check_application_status(tool_context=_tc())

        assert result.get("found") is False
        assert "specify" in result.get("message", "").lower() or "scheme" in result.get("message", "").lower()

    async def test_user_isolation(self):
        """User A cannot see User B's application via scheme_id."""
        from app.services.firestore_service import upsert_user, create_application
        from agents.tools.status_tools import check_application_status

        await upsert_user(AUTH_UID, {"name": "Owner", "email": "o@test.com"})
        await upsert_user(OTHER_UID, {"name": "Other", "email": "x@test.com"})

        # Create app for OTHER_UID
        other_app = await create_application(OTHER_UID, "scheme_pm_nsp_merit")

        # AUTH_UID tries to check status by scheme — should not find it
        result = await check_application_status(
            scheme_id="scheme_pm_nsp_merit", tool_context=_tc(AUTH_UID)
        )

        assert result.get("found") is False
        assert "No application" in result.get("message", "")

    async def test_user_isolation_direct_id(self):
        """User A cannot access User B's application by direct ID."""
        from app.services.firestore_service import upsert_user, create_application
        from agents.tools.status_tools import check_application_status

        await upsert_user(AUTH_UID, {"name": "Owner", "email": "o@test.com"})
        await upsert_user(OTHER_UID, {"name": "Other", "email": "x@test.com"})

        other_app = await create_application(OTHER_UID, "scheme_pm_nsp_merit")

        result = await check_application_status(
            application_id=other_app["id"], tool_context=_tc(AUTH_UID)
        )

        assert result.get("error") is not None or result.get("found") is False

    async def test_scheme_nsap_not_treated_as_application_id(self):
        """scheme_nsap must NOT be passed as application_id."""
        from agents.tools.status_tools import check_application_status

        result = await check_application_status(
            scheme_id="scheme_nsap", tool_context=_tc()
        )

        # Should return not-found, not an error about invalid application_id
        assert result.get("found") is False
        assert "application_id" not in result or result.get("application_id") != "scheme_nsap"
