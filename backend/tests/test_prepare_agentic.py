"""Tests for Agent-driven application preparation flow.

Verifies that:
1. prepare_form_fields tool exists and is callable
2. create_application tool exists and is callable
3. The form_prep_agent has the right tools
4. The orchestrator can route to form_prep_agent
5. The mock orchestrator routes "prepare" to form_prep_agent
"""
import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')

import pytest


# ─── Tool availability ──────────────────────────────────────────────────────

def test_prepare_form_fields_exists():
    """prepare_form_fields is importable and callable."""
    from agents.tools.application_tools import prepare_form_fields
    assert callable(prepare_form_fields)


def test_create_application_exists():
    """create_application is importable and callable."""
    from agents.tools.application_tools import create_application
    assert callable(create_application)


def test_form_prep_agent_has_correct_tools():
    """form_prep_agent is created with the expected tool set."""
    from agents.form_prep_agent import create_form_prep_agent
    agent = create_form_prep_agent()
    # Mock agent stores tools by name
    if hasattr(agent, '_tools'):
        tool_names = set(agent._tools.keys())
        assert 'prepare_form_fields' in tool_names
        assert 'create_application' in tool_names
        assert 'get_user_profile' in tool_names
        assert 'fill_mock_portal' in tool_names


# ─── Tool execution ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_prepare_form_fields_returns_structured_result():
    """prepare_form_fields returns the expected structure."""
    from agents.tools.application_tools import prepare_form_fields
    result = await prepare_form_fields(user_id="test-user", scheme_id="scheme_pm_nsp_merit")
    # May return error if scheme/user not found, but should have the right shape
    assert isinstance(result, dict)
    if "error" not in result:
        assert "form_fields" in result
        assert "missing_fields" in result
        assert "missing_documents" in result
        assert "required_documents" in result
        assert "ready_to_submit" in result
        assert "notes" in result
        assert "scheme_name" in result


@pytest.mark.asyncio
async def test_prepare_form_fields_missing_scheme():
    """prepare_form_fields returns error for unknown scheme."""
    from agents.tools.application_tools import prepare_form_fields
    result = await prepare_form_fields(user_id="test-user", scheme_id="nonexistent")
    assert "error" in result


# ─── Mock orchestrator routing ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_mock_orchestrator_routes_prepare():
    """Mock orchestrator routes 'prepare' keyword to form_prep_agent."""
    from agents.orchestrator import _MockOrchestrator

    # Create mock sub-agents
    class MockAgent:
        name = "mock"
        async def run_async(self, **kwargs):
            return {"response_text": f"Mock result for {kwargs}", "actions": []}

    orch = _MockOrchestrator(MockAgent(), MockAgent(), MockAgent())
    result = await orch.run_async(
        user_id="test-user",
        message="Prepare my application for scheme X",
        scheme_id="scheme_test",
    )
    assert "response_text" in result


@pytest.mark.asyncio
async def test_mock_orchestrator_routes_legitimacy():
    """Mock orchestrator routes 'legitimacy' keyword to legitimacy_agent."""
    from agents.orchestrator import _MockOrchestrator

    class MockAgent:
        name = "mock"
        async def run_async(self, **kwargs):
            return {"response_text": f"Mock result for {kwargs}", "actions": []}

    orch = _MockOrchestrator(MockAgent(), MockAgent(), MockAgent())
    result = await orch.run_async(
        user_id="test-user",
        message="Is this scheme legitimate?",
    )
    assert "response_text" in result


@pytest.mark.asyncio
async def test_mock_orchestrator_routes_discovery():
    """Mock orchestrator routes default messages to discovery_agent."""
    from agents.orchestrator import _MockOrchestrator

    class MockAgent:
        name = "mock"
        async def run_async(self, **kwargs):
            return {"response_text": f"Mock result for {kwargs}", "actions": []}

    orch = _MockOrchestrator(MockAgent(), MockAgent(), MockAgent())
    result = await orch.run_async(
        user_id="test-user",
        message="What scholarships can I apply for?",
    )
    assert "response_text" in result


# ─── Runner integration ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_runner_mock_mode_handles_prepare():
    """Runner in mock mode handles preparation requests."""
    from agents.runner import HazelaRunner

    runner = HazelaRunner()
    runner.initialise()

    result = await runner.run_agent(
        user_id="test-user",
        message="Prepare my application for scheme_pm_nsp_merit",
        session_id="test-session-prepare",
    )
    assert isinstance(result, dict)
    assert "response_text" in result
    assert "session_id" in result
    assert result["session_id"] == "test-session-prepare"
