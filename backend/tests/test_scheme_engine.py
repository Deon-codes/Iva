"""
Tests for the scheme engine — Data.gov.in client, normalization, ingestion,
search, ranking, and API endpoints.

All external HTTP calls are mocked. No live API calls.
"""

from __future__ import annotations

import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


# ─────────────────────────────────────────────────────────────────────────────
# Data.gov.in Client
# ─────────────────────────────────────────────────────────────────────────────

class TestDataGovClient:
    """Tests for the Data.gov.in API client."""

    @pytest.mark.asyncio
    async def test_fetch_resource_success(self):
        mock_response_data = {
            "records": [{"state_ut": "Maharashtra", "a_y__2023_24___beneficiaries": 5000}],
            "total": 1,
            "title": "Test Resource",
        }

        with patch("app.services.datagov_client._async_raw_http_get", new_callable=AsyncMock) as mock_raw:
            mock_raw.return_value = mock_response_data

            from app.services.datagov_client import DataGovClient
            client = DataGovClient(api_key="test-key")
            result = await client.fetch_resource("test-resource-id")

            assert result["success"] is True
            assert len(result["records"]) == 1
            assert result["records"][0]["state_ut"] == "Maharashtra"

    @pytest.mark.asyncio
    async def test_fetch_resource_error_response(self):
        mock_response_data = {
            "error": {"type": "NOT_ALLOWED", "description": "Method not allowed"},
        }

        with patch("app.services.datagov_client._async_raw_http_get", new_callable=AsyncMock) as mock_raw:
            mock_raw.return_value = mock_response_data

            from app.services.datagov_client import DataGovClient
            client = DataGovClient(api_key="bad-key")
            result = await client.fetch_resource("error-test-resource", use_cache=False)

            assert result["success"] is False
            assert "not allowed" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_fetch_resource_timeout(self):
        with patch("app.services.datagov_client._async_raw_http_get", new_callable=AsyncMock) as mock_raw:
            mock_raw.return_value = None  # Simulates timeout/failure

            from app.services.datagov_client import DataGovClient
            client = DataGovClient(api_key="test-key")
            result = await client.fetch_resource("timeout-test-res", use_cache=False)

            assert result["success"] is False
            assert "failed" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_fetch_resource_message_only(self):
        mock_response_data = {"message": "Meta not found"}

        with patch("app.services.datagov_client._async_raw_http_get", new_callable=AsyncMock) as mock_raw:
            mock_raw.return_value = mock_response_data

            from app.services.datagov_client import DataGovClient
            client = DataGovClient(api_key="test-key")
            result = await client.fetch_resource("notfound-test", use_cache=False)

            assert result["success"] is False
            assert "Meta not found" in result["error"]

    @pytest.mark.asyncio
    async def test_cache_hit(self):
        from app.services.datagov_client import _cache, DataGovClient

        _cache["test-resource:1:500"] = {
            "data": {"records": [{"cached": True}], "total": 1, "success": True},
            "fetched_at": 9999999999.0,
        }

        client = DataGovClient(api_key="test-key")
        result = await client.fetch_resource("test-resource", use_cache=True)

        assert result["records"][0]["cached"] is True

        del _cache["test-resource:1:500"]


# ─────────────────────────────────────────────────────────────────────────────
# Normalization
# ─────────────────────────────────────────────────────────────────────────────

class TestNormalization:
    """Tests for Data.gov.in record normalization."""

    def test_normalize_valid_record(self):
        from app.services.scheme_ingestion import normalize_datagov_record

        record = {
            "sl__no_": "1",
            "state_ut": "Maharashtra",
            "a_y__2023_24___beneficiaries": 5000,
            "a_y__2022_23___beneficiaries": 4500,
        }
        config = {
            "source": "data.gov.in",
            "resource_id": "test-123",
            "source_url": "https://data.gov.in/resource/test",
            "organization": "Ministry of Tribal Affairs",
            "title": "Post-Matric Scholarship for ST Students",
            "category": "scholarship",
        }

        result = normalize_datagov_record(record, config)

        assert result is not None
        assert "Maharashtra" in result["name"]
        assert result["state"] == "Maharashtra"
        assert result["source"] == "data.gov.in"
        assert result["resource_id"] == "test-123"
        assert result["source_type"] == "datagov_in"
        assert result["supporting_data"]["total_beneficiaries"] == 9500
        assert result["eligibility"]["states"] == ["Maharashtra"]

    def test_normalize_empty_state(self):
        from app.services.scheme_ingestion import normalize_datagov_record

        record = {"sl__no_": "1", "state_ut": "All India"}
        config = {
            "source": "data.gov.in",
            "resource_id": "r1",
            "title": "Test Scheme",
            "organization": "Test Org",
            "category": "scholarship",
        }

        result = normalize_datagov_record(record, config)

        assert result is not None
        assert result["state"] is None
        assert result["is_central"] is True

    def test_normalize_no_records_returns_none(self):
        from app.services.scheme_ingestion import normalize_datagov_record

        # Empty record with no state — should still produce a record
        record = {"sl__no_": "1"}
        config = {
            "source": "data.gov.in",
            "resource_id": "r1",
            "title": "Test Scheme",
            "organization": "Test Org",
        }

        result = normalize_datagov_record(record, config)
        # Should still produce a record (state=None means all India)
        assert result is not None

    def test_normalize_preserves_provenance(self):
        from app.services.scheme_ingestion import normalize_datagov_record

        record = {"state_ut": "Kerala", "a_y__2023_24___beneficiaries": 200}
        config = {
            "source": "data.gov.in",
            "resource_id": "abc-123-def",
            "source_url": "https://data.gov.in/resource/abc-123-def",
            "organization": "Test Ministry",
            "title": "Scholarship Scheme",
        }

        result = normalize_datagov_record(record, config)

        assert result["source"] == "data.gov.in"
        assert result["resource_id"] == "abc-123-def"
        assert result["official_url"] == "https://data.gov.in/resource/abc-123-def"
        assert result["department"] == "Test Ministry"


# ─────────────────────────────────────────────────────────────────────────────
# Scheme Search
# ─────────────────────────────────────────────────────────────────────────────

class TestSchemeSearch:
    """Tests for scheme search/filtering."""

    @pytest.mark.asyncio
    async def test_search_scholarship(self):
        from app.services.scheme_ingestion import search_schemes_from_store

        results = await search_schemes_from_store(query="scholarship")
        assert len(results) > 0
        assert any("scholarship" in s["name"].lower() for s in results)

    @pytest.mark.asyncio
    async def test_search_maharashtra(self):
        from app.services.scheme_ingestion import search_schemes_from_store

        results = await search_schemes_from_store(state="Maharashtra")
        assert len(results) > 0
        for s in results:
            assert s.get("state") == "Maharashtra" or s.get("state") is None

    @pytest.mark.asyncio
    async def test_search_female_only(self):
        from app.services.scheme_ingestion import search_schemes_from_store

        results = await search_schemes_from_store(query="scholarship", gender="female")
        ids = [s["id"] for s in results]
        assert "scheme_aicte_pragati" in ids

    @pytest.mark.asyncio
    async def test_search_male_excludes_female_only(self):
        from app.services.scheme_ingestion import search_schemes_from_store

        results = await search_schemes_from_store(query="scholarship", gender="male")
        ids = [s["id"] for s in results]
        assert "scheme_aicte_pragati" not in ids

    @pytest.mark.asyncio
    async def test_search_no_results(self):
        from app.services.scheme_ingestion import search_schemes_from_store

        results = await search_schemes_from_store(query="xyzzy_nonexistent_12345")
        assert len(results) == 0

    @pytest.mark.asyncio
    async def test_get_all_schemes_returns_18(self):
        from app.services.scheme_ingestion import get_all_schemes_from_store

        schemes = await get_all_schemes_from_store()
        # At least 18 curated schemes (may have Data.gov.in records too)
        assert len(schemes) >= 18


# ─────────────────────────────────────────────────────────────────────────────
# Eligibility
# ─────────────────────────────────────────────────────────────────────────────

class TestEligibility:
    """Tests for the eligibility engine."""

    @pytest.mark.asyncio
    async def test_eligible_maha_sc_student(self):
        from agents.tools.scheme_tools import check_eligibility

        result = await check_eligibility(
            scheme_id="scheme_maha_rajarshi_shahu",
            age=20,
            annual_income_inr=240000,
            state="Maharashtra",
            gender="female",
            caste_category="SC",
            education_level="UG",
        )

        assert result["eligible"] is True
        assert result["scheme_id"] == "scheme_maha_rajarshi_shahu"

    @pytest.mark.asyncio
    async def test_ineligible_wrong_state(self):
        from agents.tools.scheme_tools import check_eligibility

        result = await check_eligibility(
            scheme_id="scheme_maha_rajarshi_shahu",
            age=20,
            annual_income_inr=240000,
            state="Karnataka",
            gender="female",
            caste_category="SC",
            education_level="UG",
        )

        assert result["eligible"] is False

    @pytest.mark.asyncio
    async def test_ineligible_income_over_limit(self):
        from agents.tools.scheme_tools import check_eligibility

        result = await check_eligibility(
            scheme_id="scheme_aicte_pragati",
            age=20,
            annual_income_inr=1000000,
            state=None,
            gender="female",
            caste_category=None,
            education_level="UG",
        )

        assert result["eligible"] is False

    @pytest.mark.asyncio
    async def test_ineligible_male_for_pragati(self):
        from agents.tools.scheme_tools import check_eligibility

        result = await check_eligibility(
            scheme_id="scheme_aicte_pragati",
            age=20,
            annual_income_inr=240000,
            state=None,
            gender="male",
            caste_category=None,
            education_level="UG",
        )

        assert result["eligible"] is False

    @pytest.mark.asyncio
    async def test_missing_info(self):
        from agents.tools.scheme_tools import check_eligibility

        result = await check_eligibility(
            scheme_id="scheme_maha_rajarshi_shahu",
        )

        assert len(result["missing_info"]) > 0

    @pytest.mark.asyncio
    async def test_scheme_not_found(self):
        from agents.tools.scheme_tools import check_eligibility

        result = await check_eligibility(scheme_id="nonexistent")
        assert result["eligible"] is False
        assert "not found" in result["reasons"][0].lower()

    @pytest.mark.asyncio
    async def test_disability_scheme(self):
        from agents.tools.scheme_tools import check_eligibility

        # Saksham requires disability — without it, should be insufficient_information
        result = await check_eligibility(
            scheme_id="scheme_aicte_saksham",
            age=20,
            annual_income_inr=240000,
            education_level="UG",
        )

        assert result["eligibility_status"] == "insufficient_information"


# ─────────────────────────────────────────────────────────────────────────────
# Ranking
# ─────────────────────────────────────────────────────────────────────────────

class TestRanking:
    """Tests for scheme ranking/matching."""

    def test_ranking_maharashtra_sc_female(self):
        from app.services.scheme_ranking import rank_schemes_for_user
        from app.services.scheme_data import get_all_schemes

        profile = {
            "state": "Maharashtra",
            "education_level": "UG",
            "caste_category": "SC",
            "annual_income_inr": 240000,
            "gender": "female",
            "age": 20,
        }

        schemes = get_all_schemes()
        loop = asyncio.new_event_loop()
        ranked = loop.run_until_complete(rank_schemes_for_user(schemes, profile))
        loop.close()

        assert len(ranked) > 0
        top_ids = [s["id"] for s in ranked[:5]]
        assert "scheme_maha_rajarshi_shahu" in top_ids
        assert ranked[0]["match_score"] == 100

    def test_ranking_no_profile(self):
        from app.services.scheme_ranking import compute_match_score

        scheme = {"eligibility": {"states": None}}
        score, elig = compute_match_score(scheme, None)
        assert score == 0
        assert elig["status"] == "insufficient_information"

    def test_ranking_empty_profile(self):
        from app.services.scheme_ranking import compute_match_score

        scheme = {"eligibility": {"states": None, "education_levels": None, "caste_categories": None, "gender": "any"}}
        score, fields = compute_match_score(scheme, {})
        assert score > 0


# ─────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────────────────────────────────────

class TestSchemeAPI:
    """Tests for /api/schemes endpoints."""

    def test_list_schemes(self, test_client):
        resp = test_client.get("/api/schemes")
        assert resp.status_code == 200
        schemes = resp.json()
        assert len(schemes) >= 18
        ids = [s["id"] for s in schemes]
        assert "scheme_aicte_pragati" in ids
        assert "scheme_maha_rajarshi_shahu" in ids
        assert "scheme_pm_nsp_merit" in ids
        assert "scheme_nmmss" in ids

    def test_list_schemes_filter_state(self, test_client):
        resp = test_client.get("/api/schemes?state=Maharashtra")
        assert resp.status_code == 200
        schemes = resp.json()
        assert len(schemes) >= 3
        for s in schemes:
            assert s["state"] == "Maharashtra" or s["state"] is None

    def test_list_schemes_filter_category(self, test_client):
        resp = test_client.get("/api/schemes?category=welfare")
        assert resp.status_code == 200
        schemes = resp.json()
        assert len(schemes) >= 2

    def test_list_schemes_search(self, test_client):
        resp = test_client.get("/api/schemes?query=pragati")
        assert resp.status_code == 200
        schemes = resp.json()
        assert len(schemes) >= 1
        assert any("Pragati" in s["name"] for s in schemes)

    def test_get_scheme_detail(self, test_client):
        resp = test_client.get("/api/schemes/scheme_aicte_pragati")
        assert resp.status_code == 200
        scheme = resp.json()
        assert scheme["name"] == "AICTE Pragati Scholarship for Girl Students (Technical Degree/Diploma)"
        assert "required_documents" in scheme
        assert "official_url" in scheme
        assert "eligibility" in scheme

    def test_get_scheme_not_found(self, test_client):
        resp = test_client.get("/api/schemes/scheme_does_not_exist")
        assert resp.status_code == 404

    def test_list_schemes_response_shape(self, test_client):
        resp = test_client.get("/api/schemes")
        assert resp.status_code == 200
        schemes = resp.json()
        first = schemes[0]
        required_fields = ["id", "name", "department", "category", "is_central", "benefits_summary", "official_url", "eligibility_summary", "source"]
        for field in required_fields:
            assert field in first, f"Missing field: {field}"


# ─────────────────────────────────────────────────────────────────────────────
# Firestore Upsert/Search
# ─────────────────────────────────────────────────────────────────────────────

class TestFirestoreSchemes:
    """Tests for Firestore scheme CRUD operations."""

    @pytest.mark.asyncio
    async def test_upsert_and_get(self):
        from app.services.firestore_service import upsert_scheme, get_scheme

        data = {"id": "test_1", "name": "Test Scheme", "eligibility": {}}
        await upsert_scheme("test_1", data)

        result = await get_scheme("test_1")
        assert result is not None
        assert result["name"] == "Test Scheme"

    @pytest.mark.asyncio
    async def test_upsert_overwrites(self):
        from app.services.firestore_service import upsert_scheme, get_scheme

        await upsert_scheme("test_2", {"id": "test_2", "name": "V1"})
        await upsert_scheme("test_2", {"id": "test_2", "name": "V2"})

        result = await get_scheme("test_2")
        assert result["name"] == "V2"

    @pytest.mark.asyncio
    async def test_list_schemes(self):
        from app.services.firestore_service import upsert_scheme, list_schemes

        await upsert_scheme("s1", {"id": "s1", "name": "A"})
        await upsert_scheme("s2", {"id": "s2", "name": "B"})

        all_schemes = await list_schemes()
        assert len(all_schemes) >= 2

    @pytest.mark.asyncio
    async def test_search_schemes_by_keyword(self):
        from app.services.firestore_service import upsert_scheme, search_schemes

        await upsert_scheme("s1", {
            "id": "s1",
            "name": "Scholarship for SC students",
            "description": "Post-matric scholarship",
            "eligibility": {"description": "SC students from Maharashtra"},
            "department": "Social Justice",
            "category": "scholarship",
            "state": "Maharashtra",
        })
        await upsert_scheme("s2", {
            "id": "s2",
            "name": "Welfare pension scheme",
            "description": "Old age pension",
            "eligibility": {"description": "Senior citizens"},
            "department": "Rural Development",
            "category": "welfare",
            "state": None,
        })

        results = await search_schemes(query="scholarship SC")
        assert len(results) >= 1
        assert any("SC" in s.get("name", "") for s in results)

    @pytest.mark.asyncio
    async def test_search_schemes_by_state(self):
        from app.services.firestore_service import upsert_scheme, search_schemes

        await upsert_scheme("s1", {"id": "s1", "name": "A", "state": "Maharashtra"})
        await upsert_scheme("s2", {"id": "s2", "name": "B", "state": "Karnataka"})

        results = await search_schemes(state="Maharashtra")
        assert all(s.get("state") == "Maharashtra" for s in results)
