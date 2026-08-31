"""
Tests for agent routing, eligibility checks, legitimacy rules, and form preparation.
All run in mock mode (no Gemini API key required).
"""

from __future__ import annotations

import pytest


# ─────────────────────────────────────────────────────────────────────────────
# Scheme tools — eligibility checks
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search_schemes_returns_results():
    from agents.tools.scheme_tools import search_schemes

    results = await search_schemes("scholarship for student")
    assert len(results) >= 1
    assert all("id" in s and "name" in s for s in results)


@pytest.mark.asyncio
async def test_search_schemes_gender_filter():
    from agents.tools.scheme_tools import search_schemes

    female_results = await search_schemes("scholarship", gender="female")
    # AICTE Pragati is female-only; should be included
    ids = [r["id"] for r in female_results]
    assert "scheme_aicte_pragati" in ids

    # PM NSP is "any" gender — should also appear
    # No male-only scheme in MVP, so male filter returns "any" gender schemes
    male_results = await search_schemes("scholarship", gender="male")
    assert "scheme_aicte_pragati" not in [r["id"] for r in male_results]


@pytest.mark.asyncio
async def test_check_eligibility_eligible(sample_user):
    from agents.tools.scheme_tools import check_eligibility

    result = await check_eligibility(
        scheme_id="scheme_aicte_pragati",
        age=sample_user["age"],
        annual_income_inr=sample_user["annual_income_inr"],
        state=sample_user["state"],
        gender=sample_user["gender"],
        caste_category=sample_user["caste_category"],
        education_level=sample_user["education_level"],
    )
    assert result["eligible"] is True
    assert "scheme_aicte_pragati" == result["scheme_id"]


@pytest.mark.asyncio
async def test_check_eligibility_income_exceeds_limit():
    from agents.tools.scheme_tools import check_eligibility

    result = await check_eligibility(
        scheme_id="scheme_aicte_pragati",
        annual_income_inr=1_500_000,  # ₹15L — exceeds ₹8L limit
        gender="female",
        education_level="UG",
    )
    assert result["eligible"] is False
    assert any("income" in r.lower() for r in result["reasons"])


@pytest.mark.asyncio
async def test_check_eligibility_wrong_gender():
    from agents.tools.scheme_tools import check_eligibility

    result = await check_eligibility(
        scheme_id="scheme_aicte_pragati",
        gender="male",
        education_level="UG",
    )
    assert result["eligible"] is False
    assert any("gender" in r.lower() or "female" in r.lower() for r in result["reasons"])


@pytest.mark.asyncio
async def test_check_eligibility_wrong_state():
    from agents.tools.scheme_tools import check_eligibility

    result = await check_eligibility(
        scheme_id="scheme_maha_rajarshi_shahu",
        state="Rajasthan",
        caste_category="SC",
        education_level="UG",
    )
    assert result["eligible"] is False
    assert any("Maharashtra" in r for r in result["reasons"])


@pytest.mark.asyncio
async def test_check_eligibility_missing_info():
    from agents.tools.scheme_tools import check_eligibility

    # Provide no optional fields for a scheme with income limit
    result = await check_eligibility(scheme_id="scheme_aicte_pragati")
    # Should note missing_info but not fail outright on non-provided fields
    assert "missing_info" in result
    assert len(result["missing_info"]) > 0


# ─────────────────────────────────────────────────────────────────────────────
# Legitimacy tools — deterministic rule checks
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_legitimacy_trusted_domain():
    from agents.tools.legitimacy_tools import check_domain_legitimacy

    result = await check_domain_legitimacy("https://scholarships.gov.in")
    assert result["trusted"] is True
    assert result["verdict"] == "legitimate"


@pytest.mark.asyncio
async def test_legitimacy_untrusted_domain():
    from agents.tools.legitimacy_tools import check_domain_legitimacy

    result = await check_domain_legitimacy("https://scholarships-india.blogspot.com")
    assert result["trusted"] is False
    assert result["verdict"] == "warning"


@pytest.mark.asyncio
async def test_legitimacy_upfront_fee_detected():
    from agents.tools.legitimacy_tools import apply_legitimacy_rules

    result = await apply_legitimacy_rules(
        scheme_name="PM Merit Scholarship",
        url="https://scholarships.gov.in",
        description="Pay a processing fee of ₹500 to register your application.",
    )
    assert result["overall_verdict"] == "suspicious"
    assert result["risk_level"] == "high"


@pytest.mark.asyncio
async def test_legitimacy_scheme_in_registry():
    from agents.tools.legitimacy_tools import check_scheme_in_registry

    result = await check_scheme_in_registry("AICTE Pragati Scholarship")
    assert result["in_registry"] is True


@pytest.mark.asyncio
async def test_legitimacy_unknown_scheme_warning():
    from agents.tools.legitimacy_tools import check_scheme_in_registry

    result = await check_scheme_in_registry("Qwerty Plugh Widget Rebate 2026")
    assert result["in_registry"] is False
    assert result["verdict"] == "warning"


@pytest.mark.asyncio
async def test_legitimacy_full_check_legitimate_scheme():
    from agents.tools.legitimacy_tools import apply_legitimacy_rules

    result = await apply_legitimacy_rules(
        scheme_name="AICTE Pragati Scholarship",
        url="https://www.aicte-india.org/schemes/students-development-schemes/Pragati-Scholarship",
        description="Government scholarship for girl students in technical education.",
    )
    assert result["overall_verdict"] == "legitimate"
    assert result["risk_level"] == "low"
    assert len(result["sources"]) > 0


# ─────────────────────────────────────────────────────────────────────────────
# Form preparation tools
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_prepare_form_fields_with_complete_profile(sample_user):
    from app.services.firestore_service import upsert_user
    from agents.tools.application_tools import prepare_form_fields

    await upsert_user(sample_user["id"], sample_user)
    result = await prepare_form_fields(sample_user["id"], "scheme_aicte_pragati")

    assert "form_fields" in result
    # Fields now have {value, source, verified} structure
    name_field = result["form_fields"]["applicant_name"]
    assert name_field["value"] == "Priya Sharma" if isinstance(name_field, dict) else name_field == "Priya Sharma"
    state_field = result["form_fields"]["state_of_domicile"]
    assert state_field["value"] == "Maharashtra" if isinstance(state_field, dict) else state_field == "Maharashtra"
    assert "required_documents" in result


@pytest.mark.asyncio
async def test_prepare_form_fields_missing_profile():
    from agents.tools.application_tools import prepare_form_fields

    result = await prepare_form_fields("nonexistent_user_xyz", "scheme_aicte_pragati")
    assert "error" in result


@pytest.mark.asyncio
async def test_prepare_form_fields_missing_scheme(sample_user):
    from app.services.firestore_service import upsert_user
    from agents.tools.application_tools import prepare_form_fields

    await upsert_user(sample_user["id"], sample_user)
    result = await prepare_form_fields(sample_user["id"], "scheme_nonexistent_xyz")
    assert "error" in result


# ─────────────────────────────────────────────────────────────────────────────
# Mock portal
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_mock_portal_hard_stop(sample_user):
    from agents.mock_portal.portal import fill_mock_portal

    form_fields = {"applicant_name": "Priya", "state_of_domicile": "Maharashtra"}
    result = await fill_mock_portal(sample_user["id"], "scheme_aicte_pragati", form_fields)

    assert result["portal_status"] == "ready_for_review"
    assert "session_id" in result
    assert "OTP" in result["hard_stop_message"] or "identity verification" in result["hard_stop_message"]
    # Must never say "submitted"
    assert "submitted" not in result["portal_status"]


# ─────────────────────────────────────────────────────────────────────────────
# Mock orchestrator routing
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_mock_orchestrator_routes_to_discovery(sample_user):
    from agents.runner import IvaRunner

    runner = IvaRunner()
    runner.initialise()

    result = await runner.run_agent(
        user_id=sample_user["id"],
        message="Which scholarships am I eligible for?",
    )
    assert "response_text" in result
    assert "session_id" in result
    # Mock agent should mention scheme names
    assert len(result["response_text"]) > 0


@pytest.mark.asyncio
async def test_mock_orchestrator_routes_to_legitimacy():
    from agents.runner import IvaRunner

    runner = IvaRunner()
    runner.initialise()

    result = await runner.run_agent(
        user_id="user_test",
        message="Is this scholarship legitimate?",
    )
    assert "response_text" in result
    assert "Legitimacy" in result["response_text"] or "MOCK" in result["response_text"]


# ─────────────────────────────────────────────────────────────────────────────
# Agent Core public interface tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_agent_core_import_succeeds():
    """The canonical import path works."""
    from agents.runner import iva_runner, IvaRunner
    assert iva_runner is not None
    assert isinstance(iva_runner, IvaRunner)
    assert hasattr(iva_runner, "run_agent")


@pytest.mark.asyncio
async def test_run_agent_accepts_documented_args():
    """run_agent() accepts user_id, message, session_id, context."""
    from agents.runner import iva_runner
    result = await iva_runner.run_agent(
        user_id="test_user_interface",
        message="Hello",
        session_id="test_session_123",
        context={"key": "value"},
    )
    assert isinstance(result, dict)
    assert "response_text" in result
    assert "session_id" in result


@pytest.mark.asyncio
async def test_run_agent_respects_session_id():
    """When a session_id is provided, it is echoed back."""
    from agents.runner import iva_runner
    result = await iva_runner.run_agent(
        user_id="test_user_session",
        message="Hello",
        session_id="my_custom_session_id",
    )
    assert result["session_id"] == "my_custom_session_id"


@pytest.mark.asyncio
async def test_run_agent_generates_session_id_when_omitted():
    """When no session_id is given, one is auto-generated."""
    from agents.runner import iva_runner
    result = await iva_runner.run_agent(
        user_id="test_user_no_session",
        message="Hello",
    )
    assert isinstance(result["session_id"], str)
    assert len(result["session_id"]) > 0


@pytest.mark.asyncio
async def test_run_agent_returns_documented_shape():
    """The return dict contains all documented keys."""
    from agents.runner import iva_runner
    result = await iva_runner.run_agent(
        user_id="test_user_shape",
        message="Find me a scholarship",
    )
    assert "response_text" in result
    assert "actions" in result
    assert "session_id" in result
    assert "status_update" in result
    assert isinstance(result["response_text"], str)
    assert isinstance(result["actions"], list)
    assert len(result["response_text"]) > 0


@pytest.mark.asyncio
async def test_run_agent_voice_style_call():
    """Simulates how voice_service calls run_agent (without response_text key access)."""
    from agents.runner import iva_runner
    result = await iva_runner.run_agent(
        user_id="usr_telephony_919876543210",
        message="I want to check my application status",
        session_id="voice_call_session_001",
    )
    response_text = result.get("response_text", "")
    assert len(response_text) > 0
    assert result["session_id"] == "voice_call_session_001"
