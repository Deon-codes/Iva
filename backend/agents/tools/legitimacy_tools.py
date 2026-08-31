"""
Legitimacy tools — deterministic rule checks used by the Legitimacy Agent.

Critical principle:
  "Gemini alone never proves legitimacy — it explains/summarises;
   the rules decide."

Rule priority (deterministic, evaluated before Gemini):
  1. Upfront processing fee mentioned → SUSPICIOUS (highest risk)
  2. Sensitive credential request (OTP/password/Aadhaar) → SUSPICIOUS
  3. Domain not in TRUSTED_DOMAINS → WARNING
  4. Scheme name not in known registry → WARNING
  5. Application URL differs from source → WARNING
  6. Conflicting information found → FLAG_FOR_HUMAN

New capabilities:
  - Source classification (official/government/data/unverified/suspicious)
  - Scheme provenance verification against canonical DB records
  - User-provided URL verification
  - Application URL consistency check
  - Sensitive credential detection
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Source classification
# ─────────────────────────────────────────────────────────────────────────────

class SourceClassification:
    OFFICIAL_GOVERNMENT = "official_government"
    OFFICIAL_SCHEME_PORTAL = "official_scheme_portal"
    GOVERNMENT_DATA = "government_data"
    SECONDARY_TRUSTED = "secondary_trusted"
    UNVERIFIED = "unverified"
    SUSPICIOUS = "suspicious"


# Domain → classification mapping
_DOMAIN_CLASSIFICATION = {
    "scholarships.gov.in": SourceClassification.OFFICIAL_SCHEME_PORTAL,
    "myscheme.gov.in": SourceClassification.OFFICIAL_SCHEME_PORTAL,
    "nsp.gov.in": SourceClassification.OFFICIAL_SCHEME_PORTAL,
    "mahadbt.maharashtra.gov.in": SourceClassification.OFFICIAL_SCHEME_PORTAL,
    "aicte-india.org": SourceClassification.OFFICIAL_SCHEME_PORTAL,
    "data.gov.in": SourceClassification.GOVERNMENT_DATA,
    "india.gov.in": SourceClassification.OFFICIAL_GOVERNMENT,
    "pib.gov.in": SourceClassification.OFFICIAL_GOVERNMENT,
}

_DOMAIN_SUFFIXES = {
    ".gov.in": SourceClassification.OFFICIAL_GOVERNMENT,
    ".nic.in": SourceClassification.OFFICIAL_GOVERNMENT,
    ".edu.in": SourceClassification.SECONDARY_TRUSTED,
    ".ac.in": SourceClassification.SECONDARY_TRUSTED,
}


# ─────────────────────────────────────────────────────────────────────────────
# Trusted domain suffixes
# ─────────────────────────────────────────────────────────────────────────────

TRUSTED_DOMAINS = {
    ".gov.in",
    ".nic.in",
    ".edu.in",
    "scholarships.gov.in",
    "mahadbt.maharashtra.gov.in",
    "aicte-india.org",
    "myscheme.gov.in",
    "india.gov.in",
    "pib.gov.in",
}

# ─────────────────────────────────────────────────────────────────────────────
# Sensitive credential keywords (never ask users to provide these)
# ─────────────────────────────────────────────────────────────────────────────

SENSITIVE_KEYWORDS = [
    "enter your otp",
    "share your otp",
    "send otp",
    "aadhaar number",
    "aadhaar details",
    "password",
    "pin code",
    "atm pin",
    "bank pin",
    "net banking password",
    "enter your aadhaar",
    "verify your aadhaar",
]

# Fee-related keywords that indicate upfront payment demands
FEE_KEYWORDS = [
    "processing fee",
    "registration fee",
    "application fee",
    "admin fee",
    "handling charge",
    "pay to apply",
    "advance payment",
    "remittance",
    "transfer fee",
]

# Known legitimate scheme names (registry subset for MVP)
KNOWN_SCHEME_NAMES = {
    "prime minister's scholarship scheme",
    "pmss",
    "pm scholarship",
    "rajarshi chhatrapati shahu maharaj scholarship",
    "rajarshi shahu maharaj scholarship",
    "aicte pragati scholarship",
    "pragati scholarship",
    "national scholarship portal",
    "nsp",
    "central sector scheme",
    "post-matric scholarship",
    "pre-matric scholarship",
    "pm yasasvi",
    "nmmss",
    "national means-cum-merit",
    "maulana azad",
    "indira gandhi scholarship",
    "aicte saksham",
    "ishan uday",
    "nhfdc",
    "nsap",
    "swami vivekanand",
}


def _classify_source_domain(url: str) -> str:
    """Classify a URL's domain into a source trust category."""
    try:
        parsed = urlparse(url)
        host = parsed.netloc.lower() if parsed.netloc else ""
        if not host or not "." in host:
            return SourceClassification.SUSPICIOUS
        # Check exact matches first
        for domain, classification in _DOMAIN_CLASSIFICATION.items():
            if host == domain or host.endswith("." + domain):
                return classification
        # Check suffix matches
        for suffix, classification in _DOMAIN_SUFFIXES.items():
            if host.endswith(suffix):
                return classification
        return SourceClassification.UNVERIFIED
    except Exception:
        return SourceClassification.SUSPICIOUS


def _is_trusted_domain(url: str) -> bool:
    """Return True if the URL's domain ends with a trusted suffix."""
    classification = _classify_source_domain(url)
    return classification not in (SourceClassification.UNVERIFIED, SourceClassification.SUSPICIOUS)


def _mentions_upfront_fee(text: str) -> bool:
    """Return True if text contains upfront payment language."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in FEE_KEYWORDS)


def _requests_sensitive_credentials(text: str) -> bool:
    """Return True if text requests OTP, password, Aadhaar, or other secrets."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in SENSITIVE_KEYWORDS)


def _scheme_in_registry(scheme_name: str) -> bool:
    """Return True if the scheme name fuzzy-matches our known registry."""
    name_lower = scheme_name.lower()
    return any(known in name_lower or name_lower in known for known in KNOWN_SCHEME_NAMES)


# ─────────────────────────────────────────────────────────────────────────────
# ADK tool functions
# ─────────────────────────────────────────────────────────────────────────────

async def check_domain_legitimacy(url: str) -> Dict[str, Any]:
    """
    Check whether a scheme's URL comes from a trusted Indian government domain.
    Also returns the source classification.
    """
    classification = _classify_source_domain(url)
    trusted = classification not in (SourceClassification.UNVERIFIED, SourceClassification.SUSPICIOUS)
    
    if trusted:
        return {
            "trusted": True,
            "verdict": "legitimate",
            "classification": classification,
            "reason": f"Domain is an official source ({classification}): {url}",
            "reference": "Iva trusted domain registry",
        }
    else:
        return {
            "trusted": False,
            "verdict": "warning",
            "classification": classification,
            "reason": (
                f"URL '{url}' does not appear to be an official government domain. "
                "Expected domains ending in .gov.in, .nic.in, .edu.in, or known trusted hosts."
            ),
            "reference": "Verify against myScheme.gov.in or the relevant government portal",
        }


async def check_scheme_in_registry(scheme_name: str) -> Dict[str, Any]:
    """
    Check whether the scheme name appears in the known legitimate scheme registry.
    Also checks against the canonical scheme database.
    """
    found = _scheme_in_registry(scheme_name)
    
    # Also check canonical scheme database
    db_match = None
    try:
        from app.services.scheme_ingestion import get_scheme_from_store
        schemes = await get_scheme_from_store("_check_all") if False else None  # skip — use search
        from app.services.scheme_data import search_schemes_by_keywords
        keywords = [w for w in scheme_name.lower().split() if len(w) > 3]
        db_matches = search_schemes_by_keywords(keywords)
        if db_matches:
            db_match = db_matches[0]
    except Exception:
        pass
    
    if found or db_match:
        source_info = ""
        if db_match:
            source_info = f" (source: {db_match.get('source', 'curated')}, official_url: {db_match.get('official_url', 'N/A')})"
        return {
            "in_registry": True,
            "verdict": "legitimate",
            "reason": f"'{scheme_name}' is in the Iva verified scheme registry{source_info}.",
            "reference": "Iva scheme registry (sourced from myScheme.gov.in, NSP, and official department sites)",
            "canonical_scheme": {
                "id": db_match["id"],
                "name": db_match["name"],
                "source": db_match.get("source"),
                "official_url": db_match.get("official_url"),
                "source_type": db_match.get("source_type"),
            } if db_match else None,
        }
    else:
        return {
            "in_registry": False,
            "verdict": "warning",
            "reason": (
                f"'{scheme_name}' was not found in the verified scheme registry. "
                "This may be a new scheme, a regional variant, or potentially fraudulent."
            ),
            "reference": "Cross-check at https://www.myscheme.gov.in",
            "canonical_scheme": None,
        }


async def verify_scheme_provenance(scheme_id: str) -> Dict[str, Any]:
    """
    Verify a scheme's provenance against its canonical database record.
    Checks: source, source_type, official_url, application_url.
    """
    try:
        from app.services.scheme_ingestion import get_scheme_from_store
        scheme = await get_scheme_from_store(scheme_id)
    except Exception:
        scheme = None
    
    if scheme is None:
        return {
            "verified": False,
            "status": "unverified",
            "reason": f"Scheme '{scheme_id}' not found in the verified database.",
            "source": None,
            "official_url": None,
            "warnings": [],
        }
    
    source = scheme.get("source", "unknown")
    source_type = scheme.get("source_type", "unknown")
    official_url = scheme.get("official_url", "")
    application_url = scheme.get("application_url", "")
    
    warnings = []
    
    # Check source is from a known government source
    source_trusted = source in ("nsp", "aicte", "ugc", "mahadbt", "nsap", "nhfdc", "data.gov.in", "curated")
    
    # Check official URL is from a trusted domain
    url_trusted = _is_trusted_domain(official_url) if official_url else False
    
    # Check application URL consistency
    if official_url and application_url:
        official_domain = urlparse(official_url).netloc.lower()
        app_domain = urlparse(application_url).netloc.lower()
        if official_domain != app_domain:
            # Different domains — check if both are trusted
            if not _is_trusted_domain(application_url):
                warnings.append(
                    f"Application URL ({application_url}) is on a different domain than "
                    f"the official source ({official_url}). Verify before proceeding."
                )
    
    if not official_url:
        warnings.append("No official source URL recorded for this scheme.")
    
    if source_trusted and url_trusted and not warnings:
        status = "verified"
        reason = f"Scheme is from a verified government source ({source}). Official URL confirmed."
    elif source_trusted or url_trusted:
        status = "partially_verified"
        reason = f"Scheme source ({source}) is recognized, but some verification could not be completed."
    else:
        status = "unverified"
        reason = "Scheme source could not be verified against known government sources."
    
    return {
        "verified": status == "verified",
        "status": status,
        "reason": reason,
        "source": source,
        "source_type": source_type,
        "official_url": official_url,
        "application_url": application_url,
        "warnings": warnings,
    }


async def verify_user_url(url: str) -> Dict[str, Any]:
    """
    Verify a user-provided URL for legitimacy.
    Checks: URL validity, domain classification, known government sources.
    """
    if not url or not url.strip():
        return {
            "status": "unverified",
            "reason": "No URL provided.",
            "url": url,
            "classification": SourceClassification.SUSPICIOUS,
            "warnings": [],
        }
    
    url = url.strip()
    
    # Validate URL format
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return {
                "status": "unverified",
                "reason": f"'{url}' is not a valid URL.",
                "url": url,
                "classification": SourceClassification.SUSPICIOUS,
                "warnings": ["Malformed URL — cannot verify."],
            }
    except Exception:
        return {
            "status": "unverified",
            "reason": f"'{url}' could not be parsed as a URL.",
            "url": url,
            "classification": SourceClassification.SUSPICIOUS,
            "warnings": ["URL parsing failed."],
        }
    
    classification = _classify_source_domain(url)
    
    if classification in (SourceClassification.OFFICIAL_GOVERNMENT, SourceClassification.OFFICIAL_SCHEME_PORTAL):
        return {
            "status": "verified",
            "reason": f"URL is from an official government source ({classification}).",
            "url": url,
            "classification": classification,
            "warnings": [],
        }
    elif classification == SourceClassification.GOVERNMENT_DATA:
        return {
            "status": "partially_verified",
            "reason": "URL is from a government data portal.",
            "url": url,
            "classification": classification,
            "warnings": ["This is a data portal, not a scheme application portal. Verify the specific scheme details."],
        }
    elif classification == SourceClassification.SECONDARY_TRUSTED:
        return {
            "status": "partially_verified",
            "reason": "URL is from an educational domain (.edu.in).",
            "url": url,
            "classification": classification,
            "warnings": ["Educational domain — verify that this is the official scheme page."],
        }
    else:
        return {
            "status": "unverified",
            "reason": f"URL '{url}' is not from a known government or trusted source.",
            "url": url,
            "classification": classification,
            "warnings": ["Verify this URL against myScheme.gov.in or the relevant government portal before proceeding."],
        }


async def apply_legitimacy_rules(
    scheme_name: str,
    url: str,
    description: str = "",
) -> Dict[str, Any]:
    """
    Apply all deterministic legitimacy rules to a scheme and return a combined verdict.
    """
    findings: List[Dict[str, Any]] = []
    sources: List[str] = []

    # Rule 1: Upfront fee (highest priority — immediately suspicious)
    if _mentions_upfront_fee(description):
        findings.append({
            "rule": "upfront_fee",
            "severity": "high",
            "verdict": "suspicious",
            "detail": "The description mentions an upfront processing/registration fee. "
                      "Legitimate government schemes NEVER charge applicants a fee to apply.",
            "reference": "Government of India policy: no legitimate scholarship charges an application fee.",
        })
        sources.append("Government of India scholarship policy")

    # Rule 2: Sensitive credential request
    if _requests_sensitive_credentials(description):
        findings.append({
            "rule": "sensitive_credentials",
            "severity": "high",
            "verdict": "suspicious",
            "detail": "The description requests sensitive credentials (OTP, password, Aadhaar details). "
                      "Legitimate government portals handle identity verification through official channels.",
            "reference": "Government of India digital security guidelines",
        })
        sources.append("Government of India digital security guidelines")

    # Rule 3: Domain check
    domain_result = await check_domain_legitimacy(url)
    findings.append({
        "rule": "domain_check",
        "severity": "medium" if domain_result["verdict"] == "warning" else "low",
        "verdict": domain_result["verdict"],
        "detail": domain_result["reason"],
        "reference": domain_result["reference"],
    })
    sources.append(domain_result["reference"])

    # Rule 4: Registry check
    registry_result = await check_scheme_in_registry(scheme_name)
    findings.append({
        "rule": "registry_check",
        "severity": "medium" if not registry_result["in_registry"] else "low",
        "verdict": registry_result["verdict"],
        "detail": registry_result["reason"],
        "reference": registry_result["reference"],
    })
    sources.append(registry_result["reference"])

    # Derive overall verdict from findings (most severe wins)
    verdicts = [f["verdict"] for f in findings]
    if "suspicious" in verdicts:
        overall = "suspicious"
        risk = "high"
        recommendation = (
            "Do NOT proceed. This scheme shows high-risk indicators. "
            "Report to cybercrime.gov.in if you believe this is a scam."
        )
    elif verdicts.count("warning") >= 2:
        overall = "flag_for_human"
        risk = "medium"
        recommendation = (
            "Exercise caution. Multiple warning signals detected. "
            "Verify directly on myScheme.gov.in or the relevant department's official website before proceeding."
        )
    elif "warning" in verdicts:
        overall = "warning"
        risk = "medium"
        recommendation = (
            "Proceed with caution. Verify the scheme details directly at "
            "https://www.myscheme.gov.in or the department's official website."
        )
    else:
        overall = "legitimate"
        risk = "low"
        recommendation = (
            "This scheme appears legitimate based on verified indicators. "
            "Always apply through the official URL provided."
        )

    return {
        "overall_verdict": overall,
        "risk_level": risk,
        "findings": findings,
        "recommendation": recommendation,
        "sources": list(set(sources)),
        "scheme_name": scheme_name,
        "url_checked": url,
    }
