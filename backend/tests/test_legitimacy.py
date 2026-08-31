"""
Tests for the legitimacy/source-verification engine.

All tests are deterministic — no Gemini calls.
"""

import asyncio
import pytest
from agents.tools.legitimacy_tools import (
    check_domain_legitimacy,
    check_scheme_in_registry,
    apply_legitimacy_rules,
    verify_scheme_provenance,
    verify_user_url,
    _classify_source_domain,
    SourceClassification,
)
from app.services.scheme_ingestion import ingest_curated_schemes


@pytest.fixture(autouse=True)
def load_schemes():
    asyncio.run(ingest_curated_schemes())


# ── Source Classification Tests ────────────────────────────────────────────


class TestSourceClassification:
    """Test domain → source classification."""

    def test_gov_in_domain(self):
        assert _classify_source_domain("https://scholarships.gov.in/apply") == SourceClassification.OFFICIAL_SCHEME_PORTAL

    def test_nic_in_domain(self):
        assert _classify_source_domain("https://nhfdc.nic.in/scheme") == SourceClassification.OFFICIAL_GOVERNMENT

    def test_edu_in_domain(self):
        assert _classify_source_domain("https://www.iitb.ac.in/scholarships") == SourceClassification.SECONDARY_TRUSTED

    def test_mahadbt_domain(self):
        assert _classify_source_domain("https://mahadbt.maharashtra.gov.in/apply") == SourceClassification.OFFICIAL_SCHEME_PORTAL

    def test_data_gov_in(self):
        assert _classify_source_domain("https://data.gov.in/resource/123") == SourceClassification.GOVERNMENT_DATA

    def test_unknown_domain(self):
        assert _classify_source_domain("https://random-scholarship.com/apply") == SourceClassification.UNVERIFIED

    def test_invalid_url(self):
        assert _classify_source_domain("not-a-url") == SourceClassification.SUSPICIOUS


# ── Domain Verification Tests ──────────────────────────────────────────────


class TestDomainVerification:
    """Test check_domain_legitimacy tool."""

    @pytest.mark.asyncio
    async def test_trusted_gov_in(self):
        result = await check_domain_legitimacy("https://scholarships.gov.in/apply")
        assert result["trusted"] is True
        assert result["verdict"] == "legitimate"
        assert "classification" in result

    @pytest.mark.asyncio
    async def test_unknown_domain(self):
        result = await check_domain_legitimacy("https://fake-scholarship.com/apply")
        assert result["trusted"] is False
        assert result["verdict"] == "warning"

    @pytest.mark.asyncio
    async def test_mahadbt(self):
        result = await check_domain_legitimacy("https://mahadbt.maharashtra.gov.in")
        assert result["trusted"] is True
        assert result["verdict"] == "legitimate"


# ── Registry Check Tests ───────────────────────────────────────────────────


class TestRegistryCheck:
    """Test check_scheme_in_registry tool."""

    @pytest.mark.asyncio
    async def test_known_scheme(self):
        result = await check_scheme_in_registry("Prime Minister's Scholarship Scheme")
        assert result["in_registry"] is True
        assert result["verdict"] == "legitimate"

    @pytest.mark.asyncio
    async def test_unknown_scheme(self):
        # Use truly unique words that won't match any scheme content
        result = await check_scheme_in_registry("Qwerty Plugh Tuple XYZZY Giveaway")
        assert result["in_registry"] is False
        assert result["verdict"] == "warning"

    @pytest.mark.asyncio
    async def test_partial_match(self):
        result = await check_scheme_in_registry("Rajarshi Shahu scholarship for students")
        assert result["in_registry"] is True

    @pytest.mark.asyncio
    async def test_canonical_match(self):
        """Scheme from canonical DB should be found even if not in KNOWN_SCHEME_NAMES."""
        result = await check_scheme_in_registry("Post-Matric Scholarship Scheme for Scheduled Caste Students")
        assert result["in_registry"] is True
        assert result.get("canonical_scheme") is not None


# ── Scheme Provenance Tests ────────────────────────────────────────────────


class TestSchemeProvenance:
    """Test verify_scheme_provenance tool."""

    @pytest.mark.asyncio
    async def test_verified_scheme(self):
        result = await verify_scheme_provenance("scheme_postmatric_sc")
        assert result["verified"] is True
        assert result["status"] == "verified"
        assert result["source"] in ("nsp", "curated")
        assert result["official_url"] is not None

    @pytest.mark.asyncio
    async def test_nonexistent_scheme(self):
        result = await verify_scheme_provenance("scheme_does_not_exist")
        assert result["verified"] is False
        assert result["status"] == "unverified"

    @pytest.mark.asyncio
    async def test_scheme_has_source(self):
        result = await verify_scheme_provenance("scheme_aicte_pragati")
        assert result["source"] == "aicte"
        assert result["verified"] is True

    @pytest.mark.asyncio
    async def test_scheme_provenance_fields(self):
        result = await verify_scheme_provenance("scheme_csss_top2")
        assert "source" in result
        assert "official_url" in result
        assert "application_url" in result
        assert "warnings" in result


# ── User URL Verification Tests ────────────────────────────────────────────


class TestUserURLVerification:
    """Test verify_user_url tool."""

    @pytest.mark.asyncio
    async def test_official_url(self):
        result = await verify_user_url("https://scholarships.gov.in/apply")
        assert result["status"] == "verified"
        assert result["classification"] == SourceClassification.OFFICIAL_SCHEME_PORTAL

    @pytest.mark.asyncio
    async def test_unknown_url(self):
        result = await verify_user_url("https://random-scholarship.com/scam")
        assert result["status"] == "unverified"
        assert len(result["warnings"]) > 0

    @pytest.mark.asyncio
    async def test_empty_url(self):
        result = await verify_user_url("")
        assert result["status"] == "unverified"

    @pytest.mark.asyncio
    async def test_malformed_url(self):
        result = await verify_user_url("not-a-valid-url")
        assert result["status"] == "unverified"

    @pytest.mark.asyncio
    async def test_data_gov_url(self):
        result = await verify_user_url("https://data.gov.in/resource/123")
        assert result["status"] == "partially_verified"
        assert result["classification"] == SourceClassification.GOVERNMENT_DATA

    @pytest.mark.asyncio
    async def test_edu_url(self):
        result = await verify_user_url("https://www.iitb.ac.in/scholarships")
        assert result["status"] == "partially_verified"
        assert result["classification"] == SourceClassification.SECONDARY_TRUSTED


# ── Full Legitimacy Rules Tests ────────────────────────────────────────────


class TestLegitimacyRules:
    """Test apply_legitimacy_rules — full verdict pipeline."""

    @pytest.mark.asyncio
    async def test_legitimate_scheme(self):
        result = await apply_legitimacy_rules(
            "Post-Matric Scholarship for SC Students",
            "https://scholarships.gov.in",
            "Government scholarship for SC students",
        )
        assert result["overall_verdict"] == "legitimate"
        assert result["risk_level"] == "low"
        assert len(result["findings"]) >= 2

    @pytest.mark.asyncio
    async def test_suspicious_upfront_fee(self):
        result = await apply_legitimacy_rules(
            "Fake Scholarship",
            "https://random-site.com/apply",
            "Pay processing fee of Rs 500 to apply for this government scholarship",
        )
        assert result["overall_verdict"] == "suspicious"
        assert result["risk_level"] == "high"
        # Should have upfront_fee finding
        fee_findings = [f for f in result["findings"] if f["rule"] == "upfront_fee"]
        assert len(fee_findings) == 1

    @pytest.mark.asyncio
    async def test_suspicious_sensitive_credentials(self):
        result = await apply_legitimacy_rules(
            "Fake Scheme",
            "https://random-site.com/apply",
            "Enter your Aadhaar number and OTP to verify eligibility",
        )
        assert result["overall_verdict"] == "suspicious"
        cred_findings = [f for f in result["findings"] if f["rule"] == "sensitive_credentials"]
        assert len(cred_findings) == 1

    @pytest.mark.asyncio
    async def test_warning_unknown_domain(self):
        result = await apply_legitimacy_rules(
            "Some Scheme",
            "https://random-site.com/info",
            "Government scholarship details",
        )
        assert result["overall_verdict"] in ("warning", "flag_for_human")
        assert result["risk_level"] == "medium"

    @pytest.mark.asyncio
    async def test_flag_for_human_multiple_warnings(self):
        """Unknown domain + unknown scheme = flag_for_human."""
        result = await apply_legitimacy_rules(
            "Fake Name Scholarship",
            "https://random-site.com/apply",
            "Apply for this government scholarship",
        )
        # Both domain and registry should warn
        assert result["overall_verdict"] in ("warning", "flag_for_human")

    @pytest.mark.asyncio
    async def test_result_structure(self):
        result = await apply_legitimacy_rules(
            "PM Scholarship",
            "https://scholarships.gov.in",
            "PM scholarship for wards of CAPF personnel",
        )
        assert "overall_verdict" in result
        assert "risk_level" in result
        assert "findings" in result
        assert "recommendation" in result
        assert "sources" in result
        assert "scheme_name" in result
        assert "url_checked" in result
        assert isinstance(result["findings"], list)
        assert isinstance(result["sources"], list)


# ── Edge Case Tests ────────────────────────────────────────────────────────


class TestEdgeCases:
    """Edge cases for the legitimacy engine."""

    @pytest.mark.asyncio
    async def test_empty_description(self):
        result = await apply_legitimacy_rules("PM Scholarship", "https://scholarships.gov.in", "")
        assert result["overall_verdict"] == "legitimate"

    @pytest.mark.asyncio
    async def test_no_url(self):
        result = await apply_legitimacy_rules("Some Scheme", "", "description")
        assert result["overall_verdict"] in ("warning", "flag_for_human", "suspicious")

    @pytest.mark.asyncio
    async def test_case_insensitive_fee_detection(self):
        result = await apply_legitimacy_rules(
            "Scam",
            "https://fake.com",
            "Pay PROCESSING FEE to apply",
        )
        assert result["overall_verdict"] == "suspicious"

    @pytest.mark.asyncio
    async def test_multiple_suspicious_indicators(self):
        """Fee + credentials = still suspicious (not worse than suspicious)."""
        result = await apply_legitimacy_rules(
            "Dangerous Scam",
            "https://fake.com",
            "Pay processing fee and enter your OTP to apply for this government scholarship",
        )
        assert result["overall_verdict"] == "suspicious"
        assert result["risk_level"] == "high"
