"""
Legitimacy tools — deterministic rule checks used by the Legitimacy Agent.

Critical principle from AGENTS.md:
  "Gemini alone never proves legitimacy — it explains/summarises;
   the rules decide."

Rule priority (deterministic, evaluated before Gemini):
  1. Upfront processing fee mentioned → SUSPICIOUS (highest risk)
  2. Domain not in TRUSTED_DOMAINS → WARNING
  3. Scheme name not in known registry → WARNING
  4. Conflicting information found → FLAG_FOR_HUMAN

Gemini only summarises the result and explains it in plain language.
The returned verdict always includes the source/reference used.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


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
# Known legitimate scheme names (registry subset for MVP)
# ─────────────────────────────────────────────────────────────────────────────

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
}

# Fee-related keywords that indicate upfront payment demands
FEE_KEYWORDS = [
    "processing fee",
    "registration fee",
    "application fee",
    "admin fee",
    "handling charge",
    "pay to apply",
    "advance payment",
]


def _is_trusted_domain(url: str) -> bool:
    """Return True if the URL's domain ends with a trusted suffix."""
    try:
        host = urlparse(url).netloc.lower()
        return any(host.endswith(trusted) or host == trusted.lstrip(".") for trusted in TRUSTED_DOMAINS)
    except Exception:
        return False


def _mentions_upfront_fee(text: str) -> bool:
    """Return True if text contains upfront payment language."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in FEE_KEYWORDS)


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

    Args:
        url: The official URL provided for the scheme.

    Returns:
        Dict with:
            - trusted (bool)
            - verdict ("legitimate" | "warning" | "suspicious")
            - reason (str)
            - reference (str) — the source/rule used
    """
    trusted = _is_trusted_domain(url)
    if trusted:
        return {
            "trusted": True,
            "verdict": "legitimate",
            "reason": f"Domain is an official government/trusted domain: {url}",
            "reference": "Trusted domain list: .gov.in, .nic.in, .edu.in, aicte-india.org",
        }
    else:
        return {
            "trusted": False,
            "verdict": "warning",
            "reason": (
                f"URL '{url}' does not appear to be an official government domain. "
                "Expected domains ending in .gov.in, .nic.in, .edu.in, or known trusted hosts."
            ),
            "reference": "Hazela trusted domain list — verify against myScheme.gov.in",
        }


async def check_scheme_in_registry(scheme_name: str) -> Dict[str, Any]:
    """
    Check whether the scheme name appears in the known legitimate scheme registry.

    Args:
        scheme_name: Name of the scheme as provided by the user or source.

    Returns:
        Dict with:
            - in_registry (bool)
            - verdict ("legitimate" | "warning")
            - reason (str)
            - reference (str)
    """
    found = _scheme_in_registry(scheme_name)
    if found:
        return {
            "in_registry": True,
            "verdict": "legitimate",
            "reason": f"'{scheme_name}' is in the Hazela verified scheme registry.",
            "reference": "Hazela scheme registry (sourced from myScheme.gov.in and official department sites)",
        }
    else:
        return {
            "in_registry": False,
            "verdict": "warning",
            "reason": (
                f"'{scheme_name}' was not found in the verified scheme registry. "
                "This may be a new scheme, a regional variant, or potentially fraudulent."
            ),
            "reference": "Hazela scheme registry — cross-check at https://www.myscheme.gov.in",
        }


async def apply_legitimacy_rules(
    scheme_name: str,
    url: str,
    description: str = "",
) -> Dict[str, Any]:
    """
    Apply all deterministic legitimacy rules to a scheme and return a combined verdict.
    Gemini uses this output to produce a user-facing explanation — it does NOT change the verdict.

    Args:
        scheme_name: Name of the scheme.
        url: The scheme's official URL.
        description: Any description or promotional text about the scheme (optional).

    Returns:
        Dict with:
            - overall_verdict ("legitimate" | "warning" | "suspicious" | "flag_for_human")
            - risk_level ("low" | "medium" | "high")
            - findings (list of finding dicts)
            - recommendation (str)
            - sources (list of str)
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

    # Rule 2: Domain check
    domain_result = await check_domain_legitimacy(url)
    findings.append({
        "rule": "domain_check",
        "severity": "medium" if domain_result["verdict"] == "warning" else "low",
        "verdict": domain_result["verdict"],
        "detail": domain_result["reason"],
        "reference": domain_result["reference"],
    })
    sources.append(domain_result["reference"])

    # Rule 3: Registry check
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
            "Do NOT proceed. This scheme shows high-risk indicators (upfront fee demand). "
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
