"""
FastAPI dependency providers.
Use these with Depends() in route handlers.
"""

from __future__ import annotations

from agents.runner import iva_runner


def get_runner():
    """Provide the IvaRunner singleton."""
    return iva_runner
