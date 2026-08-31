"""
Model Failover Tests — verify Gemini → Gemini fallback → Grok chain.

Tests use mocks to avoid consuming real Gemini/Grok quota.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


# ─── Helpers ─────────────────────────────────────────────────────────────────

class FakeRetryableError(Exception):
    """Simulates a 429/quota error."""
    pass


class FakeNonRetryableError(Exception):
    """Simulates a 400/validation error."""
    pass


def _make_runner_fn(results_or_errors):
    """
    Create a mock runner function that returns different results per model.
    
    Args:
        results_or_errors: dict mapping model_name -> result_dict or Exception
    """
    call_count = {}

    async def runner_fn(model_name: str, session_id: str = "test-session", **kwargs):
        call_count[model_name] = call_count.get(model_name, 0) + 1
        result = results_or_errors.get(model_name)
        if isinstance(result, Exception):
            raise result
        return result

    runner_fn.call_count = call_count
    return runner_fn


# ─── Tests ───────────────────────────────────────────────────────────────────

class TestIsRetryableError:
    """Test the retryable error detection logic."""

    def test_429_is_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("429 Too Many Requests")) is True

    def test_resource_exhausted_is_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("RESOURCE_EXHAUSTED")) is True

    def test_quota_is_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("quota exceeded for this model")) is True

    def test_rate_limit_is_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("rate limit exceeded")) is True

    def test_400_is_not_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("400 Bad Request")) is False

    def test_validation_error_is_not_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("invalid input format")) is False

    def test_programming_error_is_not_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(AttributeError("object has no attr")) is False

    def test_tool_error_is_not_retryable(self):
        from app.services.model_provider import _is_retryable_provider_error
        assert _is_retryable_provider_error(Exception("tool search_schemes failed")) is False


class TestModelProvider:
    """Test the ModelProvider class."""

    def test_model_chain_includes_primary_and_fallbacks(self):
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"]
            mock_settings.grok_enabled = True
            mock_settings.xai_api_key = "test-key"
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()
            chain = provider.get_model_chain()

            # Primary + 2 Gemini fallbacks + Grok = 4
            assert len(chain) == 4
            assert chain[0]["provider"] == "gemini"
            assert chain[0]["model"] == "gemini-3.6-flash"
            assert chain[3]["provider"] == "grok"

    def test_current_model_starts_at_primary(self):
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = []
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()
            assert provider.current_model == "gemini-3.6-flash"

    def test_reset_returns_to_primary(self):
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = []
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()
            provider._current_model = "gemini-3.1-flash-lite"
            provider.reset()
            assert provider.current_model == "gemini-3.6-flash"


class TestFailoverScenarios:
    """Test full failover scenarios with mocked errors."""

    @pytest.mark.asyncio
    async def test_primary_success(self):
        """Primary Gemini succeeds → no fallback."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()
            success_result = {"session_id": "s1", "response_text": "Hello!"}

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": success_result,
            })

            result = await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")
            assert result["response_text"] == "Hello!"
            assert provider.current_model == "gemini-3.6-flash"
            assert runner_fn.call_count.get("gemini-3.6-flash", 0) == 1

    @pytest.mark.asyncio
    async def test_primary_429_fallback_succeeds(self):
        """Primary Gemini 429 → fallback model succeeds."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()
            fallback_result = {"session_id": "s1", "response_text": "Fallback response"}

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": FakeRetryableError("429 RESOURCE_EXHAUSTED"),
                "gemini-3.1-flash-lite": fallback_result,
            })

            result = await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")
            assert result["response_text"] == "Fallback response"
            assert runner_fn.call_count.get("gemini-3.6-flash", 0) == 1
            assert runner_fn.call_count.get("gemini-3.1-flash-lite", 0) == 1

    @pytest.mark.asyncio
    async def test_primary_and_first_fallback_429_second_succeeds(self):
        """Primary 429 + first fallback 429 → second fallback succeeds."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"]
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()
            success_result = {"session_id": "s1", "response_text": "Second fallback works"}

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": FakeRetryableError("429 rate limit"),
                "gemini-3.1-flash-lite": FakeRetryableError("429 quota exceeded"),
                "gemini-3.5-flash-lite": success_result,
            })

            result = await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")
            assert result["response_text"] == "Second fallback works"

    @pytest.mark.asyncio
    async def test_non_429_error_does_not_switch(self):
        """Non-retryable error → no model switch, re-raise."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": FakeNonRetryableError("400 Bad Request: invalid input"),
            })

            with pytest.raises(FakeNonRetryableError):
                await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")

            # Should NOT have tried fallback
            assert runner_fn.call_count.get("gemini-3.1-flash-lite", 0) == 0

    @pytest.mark.asyncio
    async def test_all_gemini_fail_grok_disabled(self):
        """All Gemini fail + Grok disabled → controlled error response."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = False
            mock_settings.xai_api_key = ""
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": FakeRetryableError("429"),
                "gemini-3.1-flash-lite": FakeRetryableError("429"),
            })

            result = await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")
            assert "high demand" in result["response_text"].lower()
            assert "_provider_errors" in result

    @pytest.mark.asyncio
    async def test_all_gemini_fail_grok_succeeds(self):
        """All Gemini fail + Grok enabled → Grok response."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = True
            mock_settings.xai_api_key = "test-key"
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": FakeRetryableError("429"),
                "gemini-3.1-flash-lite": FakeRetryableError("429"),
                "grok-3-mini": {"session_id": "s1", "response_text": "Grok fallback works"},
            })

            result = await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")
            assert result["response_text"] == "Grok fallback works"

    @pytest.mark.asyncio
    async def test_grok_enabled_but_key_missing(self):
        """Grok enabled but XAI_API_KEY missing → skip Grok, controlled error."""
        from app.services.model_provider import ModelProvider
        from unittest.mock import patch as mock_patch

        with mock_patch("app.services.model_provider.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = True
            mock_settings.xai_api_key = ""  # Missing key
            mock_settings.grok_model = "grok-3-mini"

            provider = ModelProvider()

            runner_fn = _make_runner_fn({
                "gemini-3.6-flash": FakeRetryableError("429"),
                "gemini-3.1-flash-lite": FakeRetryableError("429"),
            })

            result = await provider.run_with_fallback(runner_fn=runner_fn, session_id="s1")
            assert "high demand" in result["response_text"].lower()
            # Grok should NOT have been attempted
            assert runner_fn.call_count.get("grok-3-mini", 0) == 0


class TestRunnerFailover:
    """Test the HazelaRunner-level failover integration."""

    @pytest.mark.asyncio
    async def test_runner_calls_correct_model_chain(self):
        """Verify the runner iterates through models on retryable errors."""
        # This test verifies the runner's _run_with_adk_fallback logic
        # without actually calling ADK — by mocking the internal _run_with_adk method
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        call_models = []

        async def mock_run_with_adk(user_id, message, session_id, context):
            call_models.append(runner._current_model)
            if len(call_models) == 1:
                raise Exception("429 RESOURCE_EXHAUSTED")
            return {"session_id": session_id, "response_text": "ok", "actions": [], "status_update": None, "suggested_next_steps": []}

        # Mock _build_orchestrator to not actually build anything
        runner._build_orchestrator = MagicMock()
        runner._run_with_adk = mock_run_with_adk

        result = await runner._run_with_adk_fallback(
            user_id="test", message="hi", session_id="s1", context={}
        )

        assert result["response_text"] == "ok"
        # Should have tried primary, then a fallback
        assert len(call_models) == 2

    @pytest.mark.asyncio
    async def test_runner_non_retryable_error_returns_error(self):
        """Non-retryable error → returns error response, no model switch."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        runner._build_orchestrator = MagicMock()

        async def mock_run_with_adk(user_id, message, session_id, context):
            raise Exception("400 Bad Request")

        runner._run_with_adk = mock_run_with_adk

        result = await runner._run_with_adk_fallback(
            user_id="test", message="hi", session_id="s1", context={}
        )

        assert "error" in result["response_text"].lower()
        # _build_orchestrator should NOT have been called for fallback
        # (only called once at init)
        assert runner._build_orchestrator.call_count <= 1


class TestRunnerGrokFailover:
    """Test the runner-level Grok failover path."""

    @pytest.mark.asyncio
    async def test_runner_all_gemini_fail_grok_succeeds(self):
        """Runner: all Gemini 429 → Grok succeeds, session preserved."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        call_count = 0

        async def mock_run_with_adk(user_id, message, session_id, context):
            nonlocal call_count
            call_count += 1
            raise Exception("429 RESOURCE_EXHAUSTED")

        runner._build_orchestrator = MagicMock()
        runner._run_with_adk = mock_run_with_adk

        # Mock the Grok HTTP call
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Grok says hello"}}]
        }

        with patch("agents.runner.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = True
            mock_settings.xai_api_key = "test-key"
            mock_settings.grok_model = "grok-4.6"

            mock_client = MagicMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.post = AsyncMock(return_value=mock_response)

            with patch("httpx.AsyncClient", return_value=mock_client):
                result = await runner._run_with_adk_fallback(
                    user_id="u1", message="hi", session_id="grok-session", context={}
                )

        assert result["response_text"] == "Grok says hello"
        assert result["session_id"] == "grok-session"
        assert call_count == 2  # Primary + 1 fallback both failed

    @pytest.mark.asyncio
    async def test_runner_grok_failure_returns_controlled_error(self):
        """Runner: all Gemini fail + Grok fails → controlled error, no crash."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        async def mock_run_with_adk(user_id, message, session_id, context):
            raise Exception("429")

        runner._build_orchestrator = MagicMock()
        runner._run_with_adk = mock_run_with_adk

        # Mock Grok HTTP call to fail
        mock_response = MagicMock()
        mock_response.status_code = 403
        mock_response.raise_for_status.side_effect = Exception("403 Forbidden")
        mock_response.text = '{"error": "no credits"}'

        with patch("agents.runner.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = True
            mock_settings.xai_api_key = "test-key"
            mock_settings.grok_model = "grok-4.6"

            mock_client = MagicMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.post = AsyncMock(return_value=mock_response)

            with patch("httpx.AsyncClient", return_value=mock_client):
                result = await runner._run_with_adk_fallback(
                    user_id="u1", message="hi", session_id="s1", context={}
                )

        # Should NOT crash — should return controlled error
        assert "high demand" in result["response_text"].lower()
        assert result["session_id"] == "s1"

    @pytest.mark.asyncio
    async def test_runner_grok_session_preserved_across_full_chain(self):
        """Session ID stays the same from primary → fallback → Grok."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        captured_sessions = []

        async def mock_run_with_adk(user_id, message, session_id, context):
            captured_sessions.append(session_id)
            raise Exception("429")

        runner._build_orchestrator = MagicMock()
        runner._run_with_adk = mock_run_with_adk

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "ok"}}]
        }

        with patch("agents.runner.settings") as mock_settings:
            mock_settings.gemini_model = "gemini-3.6-flash"
            mock_settings.gemini_fallback_list = ["gemini-3.1-flash-lite"]
            mock_settings.grok_enabled = True
            mock_settings.xai_api_key = "test-key"
            mock_settings.grok_model = "grok-4.6"

            mock_client = MagicMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client.post = AsyncMock(return_value=mock_response)

            with patch("httpx.AsyncClient", return_value=mock_client):
                result = await runner._run_with_adk_fallback(
                    user_id="u1", message="hi", session_id="persist-me", context={}
                )

        # All captured session IDs must be the same
        assert all(s == "persist-me" for s in captured_sessions)
        assert result["session_id"] == "persist-me"


class TestRunnerMockMode:
    """Test that mock mode still works without Gemini."""

    @pytest.mark.asyncio
    async def test_mock_runner_works(self):
        """Mock orchestrator returns a response without ADK."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._runner = None  # No ADK runner → mock mode

        # Create a mock orchestrator
        mock_orchestrator = MagicMock()
        mock_orchestrator.run_async = AsyncMock(return_value={
            "response_text": "Mock response",
            "actions": [],
            "status_update": None,
        })
        runner._orchestrator = mock_orchestrator

        result = await runner.run_agent(
            user_id="test",
            message="hello",
            session_id="mock-session",
        )

        assert result["response_text"] == "Mock response"
        assert result["session_id"] == "mock-session"


class TestModelPropagation:
    """Verify that fallback model propagates to ALL agents in the graph."""

    def test_discovery_agent_accepts_model(self):
        """create_discovery_agent accepts explicit model_name."""
        from agents.discovery_agent import create_discovery_agent
        with patch("agents.discovery_agent.settings") as mock_settings:
            mock_settings.gemini_enabled = False
            agent = create_discovery_agent(model_name="gemini-fallback-test")
            assert agent.name == "discovery_agent"

    def test_legitimacy_agent_accepts_model(self):
        """create_legitimacy_agent accepts explicit model_name."""
        from agents.legitimacy_agent import create_legitimacy_agent
        with patch("agents.legitimacy_agent.settings") as mock_settings:
            mock_settings.gemini_enabled = False
            agent = create_legitimacy_agent(model_name="gemini-fallback-test")
            assert agent.name == "legitimacy_agent"

    def test_form_prep_agent_accepts_model(self):
        """create_form_prep_agent accepts explicit model_name."""
        from agents.form_prep_agent import create_form_prep_agent
        with patch("agents.form_prep_agent.settings") as mock_settings:
            mock_settings.gemini_enabled = False
            agent = create_form_prep_agent(model_name="gemini-fallback-test")
            assert agent.name == "form_prep_agent"

    def test_build_orchestrator_passes_model_to_children(self):
        """Runner._build_orchestrator passes model_name to all child agents."""
        from agents.runner import HazelaRunner
        import agents.runner as runner_mod

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        captured_models = {}

        def mock_create_discovery(model_name=None):
            captured_models["discovery"] = model_name
            m = MagicMock()
            m.name = "discovery_agent"
            return m

        def mock_create_legitimacy(model_name=None):
            captured_models["legitimacy"] = model_name
            m = MagicMock()
            m.name = "legitimacy_agent"
            return m

        def mock_create_form_prep(model_name=None):
            captured_models["form_prep"] = model_name
            m = MagicMock()
            m.name = "form_prep_agent"
            return m

        def mock_create_orch(disc, leg, fp, model):
            m = MagicMock()
            return m

        # Patch the runner module's local references — these are set by
        # the local imports inside _build_orchestrator.
        # We patch the source modules so the local `from X import Y` picks them up.
        import agents.discovery_agent as da_mod
        import agents.legitimacy_agent as la_mod
        import agents.form_prep_agent as fp_mod
        import agents.orchestrator as orch_mod

        orig_da = da_mod.create_discovery_agent
        orig_la = la_mod.create_legitimacy_agent
        orig_fp = fp_mod.create_form_prep_agent
        orig_oc = orch_mod.create_orchestrator_with_model
        try:
            da_mod.create_discovery_agent = mock_create_discovery
            la_mod.create_legitimacy_agent = mock_create_legitimacy
            fp_mod.create_form_prep_agent = mock_create_form_prep
            orch_mod.create_orchestrator_with_model = mock_create_orch
            runner._build_orchestrator("gemini-3.5-flash-lite")
        finally:
            da_mod.create_discovery_agent = orig_da
            la_mod.create_legitimacy_agent = orig_la
            fp_mod.create_form_prep_agent = orig_fp
            orch_mod.create_orchestrator_with_model = orig_oc

        assert captured_models["discovery"] == "gemini-3.5-flash-lite"
        assert captured_models["legitimacy"] == "gemini-3.5-flash-lite"
        assert captured_models["form_prep"] == "gemini-3.5-flash-lite"

    def test_build_orchestrator_primary_uses_default(self):
        """When no fallback, child agents use default (None → settings.gemini_model)."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        captured_models = {}

        def mock_create_discovery(model_name=None):
            captured_models["discovery"] = model_name
            m = MagicMock()
            m.name = "discovery_agent"
            return m

        def mock_create_legitimacy(model_name=None):
            captured_models["legitimacy"] = model_name
            m = MagicMock()
            m.name = "legitimacy_agent"
            return m

        def mock_create_form_prep(model_name=None):
            captured_models["form_prep"] = model_name
            m = MagicMock()
            m.name = "form_prep_agent"
            return m

        def mock_create_orch(disc, leg, fp, model):
            m = MagicMock()
            return m

        import agents.discovery_agent as da_mod
        import agents.legitimacy_agent as la_mod
        import agents.form_prep_agent as fp_mod
        import agents.orchestrator as orch_mod

        orig_da = da_mod.create_discovery_agent
        orig_la = la_mod.create_legitimacy_agent
        orig_fp = fp_mod.create_form_prep_agent
        orig_oc = orch_mod.create_orchestrator_with_model
        try:
            da_mod.create_discovery_agent = mock_create_discovery
            la_mod.create_legitimacy_agent = mock_create_legitimacy
            fp_mod.create_form_prep_agent = mock_create_form_prep
            orch_mod.create_orchestrator_with_model = mock_create_orch
            runner._build_orchestrator("gemini-3.6-flash")
        finally:
            da_mod.create_discovery_agent = orig_da
            la_mod.create_legitimacy_agent = orig_la
            fp_mod.create_form_prep_agent = orig_fp
            orch_mod.create_orchestrator_with_model = orig_oc

        assert captured_models["discovery"] == "gemini-3.6-flash"
        assert captured_models["legitimacy"] == "gemini-3.6-flash"
        assert captured_models["form_prep"] == "gemini-3.6-flash"

    def test_fallback_rebuilds_all_agents_with_fallback_model(self):
        """During failover, ALL agents use the fallback model, not primary."""
        from agents.runner import HazelaRunner

        runner = HazelaRunner()
        runner._initialised = True
        runner._session_service = MagicMock()
        runner._runner = MagicMock()

        all_builds = []

        def mock_create_discovery(model_name=None):
            m = MagicMock()
            m.name = "discovery_agent"
            return m

        def mock_create_legitimacy(model_name=None):
            m = MagicMock()
            m.name = "legitimacy_agent"
            return m

        def mock_create_form_prep(model_name=None):
            m = MagicMock()
            m.name = "form_prep_agent"
            return m

        def mock_create_orch(disc, leg, fp, model):
            all_builds.append(model)
            m = MagicMock()
            return m

        import agents.discovery_agent as da_mod
        import agents.legitimacy_agent as la_mod
        import agents.form_prep_agent as fp_mod
        import agents.orchestrator as orch_mod

        orig_da = da_mod.create_discovery_agent
        orig_la = la_mod.create_legitimacy_agent
        orig_fp = fp_mod.create_form_prep_agent
        orig_oc = orch_mod.create_orchestrator_with_model
        try:
            da_mod.create_discovery_agent = mock_create_discovery
            la_mod.create_legitimacy_agent = mock_create_legitimacy
            fp_mod.create_form_prep_agent = mock_create_form_prep
            orch_mod.create_orchestrator_with_model = mock_create_orch
            runner._build_orchestrator("gemini-3.6-flash")
            runner._build_orchestrator("gemini-3.5-flash-lite")
            runner._build_orchestrator("gemini-2.5-flash-lite")
        finally:
            da_mod.create_discovery_agent = orig_da
            la_mod.create_legitimacy_agent = orig_la
            fp_mod.create_form_prep_agent = orig_fp
            orch_mod.create_orchestrator_with_model = orig_oc

        assert all_builds == [
            "gemini-3.6-flash",
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash-lite",
        ]
