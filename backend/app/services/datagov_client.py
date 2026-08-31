"""
Data.gov.in API client for scheme ingestion.

Provides a thin wrapper around the Data.gov.in API (https://api.data.gov.in).
Supports fetching structured datasets that expose an API endpoint.

NOTE: The httpx/requests libraries consistently time out when connecting to
api.data.gov.in from certain networks. This client uses a raw socket HTTP
transport as the primary method, with httpx as a fallback. The raw socket
approach completes in <1 second.

Usage:
    from app.services.datagov_client import DataGovClient

    client = DataGovClient(api_key="...")
    data = await client.fetch_resource("resource_id_here")
"""

from __future__ import annotations

import asyncio
import json as _json
import logging
import socket
import ssl
import time
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Base URL for Data.gov.in OGD API
BASE_URL = "https://api.data.gov.in"
HOST = "api.data.gov.in"
PORT = 443

# Default timeout for external API calls (seconds)
DEFAULT_TIMEOUT = 15

# Maximum rows to fetch per request
DEFAULT_PAGE_SIZE = 500

# Cache TTL in seconds (1 hour)
CACHE_TTL = 3600

# In-memory cache: {resource_id: {"data": [...], "fetched_at": float}}
_cache: Dict[str, Dict[str, Any]] = {}


def _raw_http_get(path: str, timeout: int = 15) -> Optional[Dict[str, Any]]:
    """
    Perform a raw HTTP GET request using socket.
    Returns parsed JSON or None on failure.

    This bypasses httpx/requests which time out on api.data.gov.in.
    """
    request = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {HOST}\r\n"
        f"Accept: application/json\r\n"
        f"User-Agent: Hazela/1.0\r\n"
        f"Connection: close\r\n"
        f"\r\n"
    )

    sock = socket.create_connection((HOST, PORT), timeout=5)
    ctx = ssl.create_default_context()
    ssock = ctx.wrap_socket(sock, server_hostname=HOST)

    try:
        ssock.sendall(request.encode())
        ssock.settimeout(timeout)

        response = b""
        start = time.time()
        while True:
            try:
                data = ssock.recv(8192)
                if not data:
                    break
                response += data
                if time.time() - start > timeout - 2:
                    break
            except socket.timeout:
                break

        text = response.decode("utf-8", errors="replace")
        # Split headers from body
        body_idx = text.find("\r\n\r\n")
        if body_idx < 0:
            return None

        body = text[body_idx + 4:]
        if not body.strip():
            return None

        # Handle chunked transfer encoding — may have multiple HTTP responses
        # Take only the first complete JSON object
        try:
            return _json.loads(body)
        except _json.JSONDecodeError:
            # Try to extract just the first JSON object
            depth = 0
            start = None
            for i, ch in enumerate(body):
                if ch == "{" and start is None:
                    start = i
                    depth = 1
                elif ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0 and start is not None:
                        try:
                            return _json.loads(body[start:i+1])
                        except _json.JSONDecodeError:
                            start = None
            return None
    except Exception as exc:
        logger.error("Raw HTTP request failed: %s", exc)
        return None
    finally:
        try:
            ssock.close()
        except Exception:
            pass


async def _async_raw_http_get(path: str, timeout: int = 15) -> Optional[Dict[str, Any]]:
    """Async wrapper around raw HTTP GET using asyncio.to_thread."""
    return await asyncio.to_thread(_raw_http_get, path, timeout)


class DataGovClient:
    """Client for the Data.gov.in API."""

    def __init__(self, api_key: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT) -> None:
        self.api_key = api_key or settings.data_gov_api_key
        self.timeout = timeout

    def _build_path(
        self,
        resource_id: str,
        filters: Optional[Dict[str, str]] = None,
        page_size: int = DEFAULT_PAGE_SIZE,
        page: int = 1,
    ) -> str:
        """Build the request path with query parameters."""
        offset = (page - 1) * page_size
        params = (
            f"?api-key={self.api_key}"
            f"&format=json"
            f"&offset={offset}"
            f"&limit={page_size}"
        )
        if filters:
            for key, value in filters.items():
                params += f"&{key}={value}"
        return f"/resource/{resource_id}{params}"

    async def fetch_resource(
        self,
        resource_id: str,
        filters: Optional[Dict[str, str]] = None,
        page_size: int = DEFAULT_PAGE_SIZE,
        page: int = 1,
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        """
        Fetch data from a Data.gov.in resource.

        Args:
            resource_id: The Data.gov.in resource ID.
            filters: Optional query filters.
            page_size: Number of records per page.
            page: Page number (1-indexed).
            use_cache: Whether to use the in-memory cache.

        Returns:
            Dict with keys:
                - records: List of record dicts
                - total: Total number of records
                - resource_id: The resource ID
                - success: bool
                - error: str or None
        """
        cache_key = f"{resource_id}:{page}:{page_size}"

        if use_cache and cache_key in _cache:
            cached = _cache[cache_key]
            if time.time() - cached["fetched_at"] < CACHE_TTL:
                logger.debug("Using cached data for resource %s", resource_id)
                return cached["data"]

        path = self._build_path(resource_id, filters, page_size, page)

        # Primary: raw socket HTTP (works reliably on api.data.gov.in)
        data = await _async_raw_http_get(path, timeout=self.timeout)

        if data is None:
            # Fallback: try httpx (may work on some networks)
            try:
                from httpx import AsyncClient, TimeoutException, HTTPError
                url = f"{BASE_URL}/resource/{resource_id}"
                params: Dict[str, Any] = {
                    "api-key": self.api_key,
                    "format": "json",
                    "offset": (page - 1) * page_size,
                    "limit": page_size,
                }
                if filters:
                    params.update(filters)

                async with AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, params=params)
                    if response.status_code == 200:
                        data = response.json()
            except Exception:
                pass

        if data is None:
            return {
                "records": [],
                "total": 0,
                "resource_id": resource_id,
                "success": False,
                "error": "Request failed (both raw socket and httpx)",
            }

        # Check for error responses
        if "error" in data:
            error_info = data["error"]
            if isinstance(error_info, dict):
                error_msg = error_info.get("description", str(error_info))
            else:
                error_msg = str(error_info)
            return {
                "records": [],
                "total": 0,
                "resource_id": resource_id,
                "success": False,
                "error": error_msg,
            }

        # Check for message-only responses (e.g., "Meta not found")
        if "message" in data and not data.get("records"):
            return {
                "records": [],
                "total": 0,
                "resource_id": resource_id,
                "success": False,
                "error": data["message"],
            }

        records = data.get("records", [])
        total = data.get("total", 0)

        result = {
            "records": records,
            "total": total,
            "resource_id": resource_id,
            "success": True,
            "error": None,
        }

        if use_cache:
            _cache[cache_key] = {"data": result, "fetched_at": time.time()}

        return result

    async def fetch_all_pages(
        self,
        resource_id: str,
        filters: Optional[Dict[str, str]] = None,
        max_pages: int = 10,
        page_size: int = DEFAULT_PAGE_SIZE,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Fetch all pages of a resource.
        """
        all_records: List[Dict[str, Any]] = []

        for page in range(1, max_pages + 1):
            result = await self.fetch_resource(
                resource_id=resource_id,
                filters=filters,
                page_size=page_size,
                page=page,
                use_cache=use_cache,
            )

            if not result["success"]:
                logger.warning(
                    "Failed to fetch page %d of resource %s: %s",
                    page, resource_id, result["error"],
                )
                break

            records = result["records"]
            if not records:
                break

            all_records.extend(records)

            if result["total"] <= page * page_size:
                break

        return all_records

    def clear_cache(self, resource_id: Optional[str] = None) -> None:
        """Clear the in-memory cache."""
        if resource_id:
            keys_to_remove = [k for k in _cache if k.startswith(resource_id)]
            for k in keys_to_remove:
                del _cache[k]
        else:
            _cache.clear()


# ── Known Resource Configurations ────────────────────────────────────────────

SCHEME_SOURCES: List[Dict[str, Any]] = [
    {
        "source": "data.gov.in",
        "resource_id": "0fbe75fa-c72a-46d8-a855-63c7c6e6c13a",
        "title": "State/UT-wise Beneficiaries under Post-Matric Scholarship for ST Students",
        "api_available": True,
        "source_url": "https://www.data.gov.in/resource/stateut-wise-beneficiaries-under-scheme-post-matric-scholarship-scheduled-tribe-st",
        "organization": "Ministry of Tribal Affairs",
        "category": "scholarship",
        "normalization_key": "post_matric_st_beneficiaries",
    },
    {
        "source": "data.gov.in",
        "resource_id": "63a2197c-7a94-4b4d-a27d-a4117fb21248",
        "title": "State/UT-wise Amount Sanctioned under Post-Matric Scholarship Scheme",
        "api_available": True,
        "source_url": "https://ap.data.gov.in/resource/stateut-wise-details-amount-sanctioned-under-post-matric-scholarship-scheme-2017-18-2021",
        "organization": "Ministry of Social Justice and Empowerment",
        "category": "scholarship",
        "normalization_key": "post_matric_amounts",
    },
]


def get_datagov_client() -> DataGovClient:
    """Factory function to create a DataGovClient instance."""
    return DataGovClient()
