"""
FastAPI dependency providers.
Use these with Depends() in route handlers.
"""

from __future__ import annotations

from agents.runner import hazela_runner


def get_runner():
    """Provide the HazelaRunner singleton."""
    return hazela_runner
