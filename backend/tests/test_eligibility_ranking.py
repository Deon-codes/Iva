"""
Tests for eligibility engine and ranking service.

Uses real scheme records from scheme_data.py.
Tests three-way eligibility, rule breakdown, ranking order, and edge cases.
"""

import asyncio
import pytest
from app.services.scheme_ranking import evaluate_eligibility, compute_match_score, rank_schemes_for_user
from app.services.scheme_ingestion import get_scheme_from_store, ingest_curated_schemes


# ── Fixtures ──────────────────────────────────────────────────────────────


@pytest.fixture(scope="module", autouse=True)
def load_schemes():
    """Ensure curated schemes are loaded once per module."""
    asyncio.run(ingest_curated_schemes())


# Profile fixtures representing real users
PROFILE_MAHARASHTRA_SC = {
    "name": "Priya Patil",
    "state": "Maharashtra",
    "caste_category": "SC",
    "annual_income_inr": 200000,
    "education_level": "UG",
    "gender": "female",
    "age": 20,
}

PROFILE_MAHARASHTRA_OBC = {
    "name": "Rahul Deshmukh",
    "state": "Maharashtra",
    "caste_category": "OBC",
    "annual_income_inr": 500000,
    "education_level": "UG",
    "gender": "male",
    "age": 21,
}

PROFILE_MAHARASHTRA_FEMALE = {
    "name": "Sneha Kulkarni",
    "state": "Maharashtra",
    "caste_category": None,
    "annual_income_inr": 500000,
    "education_level": "UG",
    "gender": "female",
    "age": 20,
}

PROFILE_DELHI_OBC = {
    "name": "Amit Kumar",
    "state": "Delhi",
    "caste_category": "OBC",
    "annual_income_inr": 500000,
    "education_level": "UG",
    "gender": "male",
    "age": 21,
}

PROFILE_INCOMPLETE = {
    "name": "Incomplete User",
    # Missing state, category, income, gender, education
}

PROFILE_HIGH_INCOME = {
    "name": "Rich User",
    "state": "Maharashtra",
    "caste_category": "SC",
    "annual_income_inr": 1000000,  # ₹10L — above most limits
    "education_level": "UG",
    "gender": "male",
    "age": 20,
}


# ── Three-way eligibility tests ───────────────────────────────────────────


class TestEligibilityThreeWay:
    """Verify the engine returns eligible / not_eligible / insufficient_information."""

    def test_eligible_sc_student_for_postmatric_sc(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, PROFILE_MAHARASHTRA_SC)
        assert result["status"] == "eligible"
        assert len(result["matched_rules"]) > 0
        assert len(result["failed_rules"]) == 0
        assert len(result["missing_information"]) == 0

    def test_not_eligible_wrong_state(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_maha_rajarshi_shahu")
        )
        result = evaluate_eligibility(scheme, PROFILE_DELHI_OBC)
        assert result["status"] == "not_eligible"
        assert any("Delhi" in f or "Maharashtra" in f for f in result["failed_rules"])

    def test_not_eligible_wrong_category(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, PROFILE_MAHARASHTRA_OBC)
        assert result["status"] == "not_eligible"
        assert any("SC" in f or "category" in f.lower() for f in result["failed_rules"])

    def test_insufficient_info_missing_category(self):
        # Rajarshi Shahu is Maharashtra-only and requires SC/ST/OBC/VJNT/SBC
        # PROFILE_MAHARASHTRA_FEMALE has no category -> insufficient_information
        scheme = asyncio.run(
            get_scheme_from_store("scheme_maha_rajarshi_shahu")
        )
        result = evaluate_eligibility(scheme, PROFILE_MAHARASHTRA_FEMALE)
        assert result["status"] == "insufficient_information"
        assert "category" in result["missing_information"]

    def test_insufficient_info_empty_profile(self):
        # Rajarshi Shahu requires state + category + income + education
        scheme = asyncio.run(
            get_scheme_from_store("scheme_maha_rajarshi_shahu")
        )
        result = evaluate_eligibility(scheme, PROFILE_INCOMPLETE)
        assert result["status"] == "insufficient_information"
        assert len(result["missing_information"]) > 0

    def test_insufficient_info_no_profile(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_maha_rajarshi_shahu")
        )
        result = evaluate_eligibility(scheme, None)
        assert result["status"] == "insufficient_information"
        assert "profile" in result["missing_information"]

    def test_not_eligible_high_income(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, PROFILE_HIGH_INCOME)
        assert result["status"] == "not_eligible"
        assert any("income" in f.lower() or "exceeds" in f.lower() for f in result["failed_rules"])


# ── Rule breakdown tests ──────────────────────────────────────────────────


class TestEligibilityRules:
    """Verify matched_rules / failed_rules / missing_information are populated."""

    def test_matched_rules_for_eligible_user(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, PROFILE_MAHARASHTRA_SC)
        # Post-Matric SC is all-India (no state restriction), gender=any
        # So matched rules: income, category, education
        assert len(result["matched_rules"]) >= 3
        assert any("income" in r.lower() for r in result["matched_rules"])
        assert any("category" in r.lower() for r in result["matched_rules"])
        assert any("education" in r.lower() for r in result["matched_rules"])

    def test_failed_rules_for_wrong_state(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_maha_rajarshi_shahu")
        )
        result = evaluate_eligibility(scheme, PROFILE_DELHI_OBC)
        assert len(result["failed_rules"]) >= 1
        # State should be in failed rules
        assert any("maharashtra" in r.lower() or "delhi" in r.lower() for r in result["failed_rules"])

    def test_missing_info_for_incomplete_profile(self):
        # scheme_postmatric_sc is all-India (states=None), gender=any
        # So only income, category, education are required
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, PROFILE_INCOMPLETE)
        assert "category" in result["missing_information"]
        assert "annual_income" in result["missing_information"]
        assert "education_level" in result["missing_information"]

    def test_reasons_are_human_readable(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, PROFILE_MAHARASHTRA_SC)
        assert len(result["reasons"]) > 0
        for reason in result["reasons"]:
            assert isinstance(reason, str)
            assert len(reason) > 0


# ── Boundary condition tests ──────────────────────────────────────────────


class TestBoundaryConditions:
    """Test exact income thresholds, age boundaries, and edge cases."""

    def test_exact_income_threshold_eligible(self):
        """Income exactly at limit should be eligible."""
        profile = {**PROFILE_MAHARASHTRA_SC, "annual_income_inr": 250000}
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, profile)
        assert result["status"] == "eligible"

    def test_one_above_income_threshold_not_eligible(self):
        """Income 1 rupee above limit should be not eligible."""
        profile = {**PROFILE_MAHARASHTRA_SC, "annual_income_inr": 250001}
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, profile)
        assert result["status"] == "not_eligible"

    def test_exact_age_boundary_eligible(self):
        """AICTE Pragati has no age limit — should still work."""
        profile = {**PROFILE_MAHARASHTRA_FEMALE, "age": 25}
        scheme = asyncio.run(
            get_scheme_from_store("scheme_aicte_pragati")
        )
        result = evaluate_eligibility(scheme, profile)
        # Pragati has no age restriction
        assert result["status"] != "not_eligible" or "age" not in " ".join(result["failed_rules"])

    def test_all_india_scheme_matches_any_state(self):
        """All-India scheme (no state restriction) should match any user."""
        scheme = asyncio.run(
            get_scheme_from_store("scheme_csss_top2")
        )
        result = evaluate_eligibility(scheme, PROFILE_DELHI_OBC)
        # CSSS is all-India — state should not be a blocker
        assert not any("state" in f.lower() and "delhi" in f.lower() for f in result["failed_rules"])

    def test_gender_restricted_scheme(self):
        """AICTE Pragati requires female — male should fail."""
        profile = {**PROFILE_MAHARASHTRA_OBC, "gender": "male"}
        scheme = asyncio.run(
            get_scheme_from_store("scheme_aicte_pragati")
        )
        result = evaluate_eligibility(scheme, profile)
        assert result["status"] == "not_eligible"
        assert any("female" in f.lower() for f in result["failed_rules"])

    def test_category_restricted_scheme(self):
        """Post-Matric SC requires SC — OBC should fail."""
        profile = {**PROFILE_MAHARASHTRA_OBC, "annual_income_inr": 200000}
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        result = evaluate_eligibility(scheme, profile)
        assert result["status"] == "not_eligible"
        assert any("SC" in f for f in result["failed_rules"])

    def test_missing_income_for_no_limit_scheme(self):
        """Scheme with no income limit should not fail on missing income."""
        scheme = asyncio.run(
            get_scheme_from_store("scheme_pm_nsp_merit")
        )
        result = evaluate_eligibility(scheme, PROFILE_INCOMPLETE)
        # PM NSP has no income limit — income should not be in missing or failed
        assert "annual_income" not in result["missing_information"]
        assert not any("income" in f.lower() for f in result["failed_rules"])


# ── Match score tests ─────────────────────────────────────────────────────


class TestMatchScore:
    """Verify scoring produces reasonable values."""

    def test_eligible_scheme_scores_high(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        score, elig = compute_match_score(scheme, PROFILE_MAHARASHTRA_SC)
        assert score >= 80  # Should be very high for fully matching profile
        assert elig["status"] == "eligible"

    def test_wrong_state_scheme_scores_low(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_maha_rajarshi_shahu")
        )
        score, elig = compute_match_score(scheme, PROFILE_DELHI_OBC)
        # State mismatch loses 25 points. Delhi user matches category=OBC,
        # education=UG, income=5L<=8L, gender=any. So score ~75.
        assert score < 100  # State mismatch prevents perfect score
        assert elig["status"] == "not_eligible"

    def test_no_profile_scores_zero(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        score, elig = compute_match_score(scheme, None)
        assert score == 0

    def test_score_between_0_and_100(self):
        scheme = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        score, _ = compute_match_score(scheme, PROFILE_MAHARASHTRA_OBC)
        assert 0 <= score <= 100


# ── Ranking tests ─────────────────────────────────────────────────────────


class TestRanking:
    """Verify ranking produces correct order and personalization."""

    def test_ranking_returns_list(self):
        schemes = asyncio.run(
            get_scheme_from_store("scheme_postmatric_sc")
        )
        # Get all schemes
        from app.services.scheme_data import get_all_schemes
        all_schemes = get_all_schemes()
        ranked = asyncio.run(
            rank_schemes_for_user(all_schemes, PROFILE_MAHARASHTRA_SC, limit=10)
        )
        assert isinstance(ranked, list)
        assert len(ranked) <= 10

    def test_eligible_schemes_rank_before_insufficient(self):
        from app.services.scheme_data import get_all_schemes
        all_schemes = get_all_schemes()
        ranked = asyncio.run(
            rank_schemes_for_user(all_schemes, PROFILE_MAHARASHTRA_SC, limit=20)
        )
        # Find the first eligible and first insufficient
        first_eligible_idx = None
        first_insufficient_idx = None
        for i, s in enumerate(ranked):
            if s["eligibility_status"] == "eligible" and first_eligible_idx is None:
                first_eligible_idx = i
            if s["eligibility_status"] == "insufficient_information" and first_insufficient_idx is None:
                first_insufficient_idx = i
        if first_eligible_idx is not None and first_insufficient_idx is not None:
            assert first_eligible_idx < first_insufficient_idx

    def test_insufficient_info_schemes_rank_before_not_eligible(self):
        from app.services.scheme_data import get_all_schemes
        all_schemes = get_all_schemes()
        ranked = asyncio.run(
            rank_schemes_for_user(all_schemes, PROFILE_MAHARASHTRA_FEMALE, limit=20)
        )
        first_insufficient_idx = None
        first_not_eligible_idx = None
        for i, s in enumerate(ranked):
            if s["eligibility_status"] == "insufficient_information" and first_insufficient_idx is None:
                first_insufficient_idx = i
            if s["eligibility_status"] == "not_eligible" and first_not_eligible_idx is None:
                first_not_eligible_idx = i
        if first_insufficient_idx is not None and first_not_eligible_idx is not None:
            assert first_insufficient_idx < first_not_eligible_idx

    def test_ranking_includes_eligibility_fields(self):
        from app.services.scheme_data import get_all_schemes
        all_schemes = get_all_schemes()
        ranked = asyncio.run(
            rank_schemes_for_user(all_schemes, PROFILE_MAHARASHTRA_SC, limit=5)
        )
        for scheme in ranked:
            assert "match_score" in scheme
            assert "eligibility_status" in scheme
            assert "matched_rules" in scheme
            assert "failed_rules" in scheme
            assert "missing_information" in scheme
            assert scheme["eligibility_status"] in ("eligible", "not_eligible", "insufficient_information")

    def test_maharashtra_sc_profile_ranks_maharashtra_sc_schemes_high(self):
        from app.services.scheme_data import get_all_schemes
        all_schemes = get_all_schemes()
        ranked = asyncio.run(
            rank_schemes_for_user(all_schemes, PROFILE_MAHARASHTRA_SC, limit=5)
        )
        # Top results should be relevant to Maharashtra SC student
        top_ids = [s["id"] for s in ranked[:3]]
        # Post-Matric SC should be in top results for an SC student
        assert any("postmatric_sc" in sid or "rajarshi" in sid for sid in top_ids)


# ── Agent tool integration test ───────────────────────────────────────────


class TestAgentToolEligibility:
    """Test the agent-facing check_eligibility function."""

    def test_check_eligibility_returns_three_way(self):
        from agents.tools.scheme_tools import check_eligibility
        result = asyncio.run(
            check_eligibility(
                "scheme_postmatric_sc",
                age=20,
                annual_income_inr=200000,
                state="Maharashtra",
                gender="female",
                caste_category="SC",
                education_level="UG",
            )
        )
        assert "eligible" in result
        assert "eligibility_status" in result
        assert result["eligibility_status"] in ("eligible", "not_eligible", "insufficient_information")
        assert "matched_rules" in result
        assert "failed_rules" in result
        assert result["eligible"] is True

    def test_check_eligibility_not_eligible(self):
        from agents.tools.scheme_tools import check_eligibility
        # Use Rajarshi Shahu (Maharashtra-only) with Delhi user
        result = asyncio.run(
            check_eligibility(
                "scheme_maha_rajarshi_shahu",
                age=20,
                annual_income_inr=500000,
                state="Delhi",
                gender="male",
                caste_category="OBC",
                education_level="UG",
            )
        )
        assert result["eligible"] is False
        assert result["eligibility_status"] == "not_eligible"

    def test_check_eligibility_insufficient_info(self):
        from agents.tools.scheme_tools import check_eligibility
        result = asyncio.run(
            check_eligibility(
                "scheme_postmatric_sc",
                # No params — all missing
            )
        )
        assert result["eligible"] is False
        assert result["eligibility_status"] == "insufficient_information"
        assert len(result["missing_info"]) > 0
