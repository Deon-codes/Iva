"""
Centralised application settings loaded from environment / .env file.
All configuration is typed via pydantic-settings.
Missing optional credentials are logged as warnings — the app still boots
and uses in-memory stubs so tests / local dev work without GCP access.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env file into os.environ for Gemini and Google ADK SDKs
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Server ────────────────────────────────────────────────────────────────
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"

    # ── Gemini ────────────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.6-flash"
    gemini_fallback_models: str = "gemini-3.1-flash-lite,gemini-3.5-flash-lite"

    # ── Grok / xAI (external fallback) ────────────────────────────────────────
    xai_api_key: str = ""
    grok_model: str = "grok-3-mini"
    enable_grok_fallback: bool = False

    # ── Google Cloud / Firestore ───────────────────────────────────────────────
    google_cloud_project: str = ""
    google_application_credentials: str = ""
    firestore_database_id: str = "(default)"

    # ── Pub/Sub ───────────────────────────────────────────────────────────────
    pubsub_topic: str = "iva-status-check"

    # ── Data.gov.in ────────────────────────────────────────────────────────────
    data_gov_api_key: str = ""

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: str = "*"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _parse_origins(cls, v: str) -> str:
        return v or "*"

    @property
    def cors_origins(self) -> List[str]:
        if self.allowed_origins == "*":
            return ["*"]
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ── Feature flags (auto-derived) ──────────────────────────────────────────
    @property
    def gemini_enabled(self) -> bool:
        enabled = bool(self.gemini_api_key)
        if not enabled:
            logger.warning(
                "GEMINI_API_KEY not set — agents will use mock responses. "
                "Set the key in .env to enable live Gemini calls."
            )
        return enabled

    @property
    def firestore_enabled(self) -> bool:
        enabled = bool(self.google_cloud_project and self.google_application_credentials)
        if not enabled:
            logger.warning(
                "Firestore credentials not fully configured — "
                "using in-memory stub. Set GOOGLE_CLOUD_PROJECT and "
                "GOOGLE_APPLICATION_CREDENTIALS in .env for live Firestore."
            )
        return enabled

    @property
    def pubsub_enabled(self) -> bool:
        return bool(self.google_cloud_project and self.pubsub_topic)

    @property
    def grok_enabled(self) -> bool:
        enabled = bool(self.xai_api_key and self.enable_grok_fallback)
        if not enabled and self.enable_grok_fallback:
            logger.warning(
                "XAI_API_KEY not set — Grok fallback disabled. "
                "Set XAI_API_KEY and ENABLE_GROK_FALLBACK=true in .env to enable."
            )
        return enabled

    @property
    def gemini_fallback_list(self) -> list:
        """Parse comma-separated fallback models into a list."""
        return [m.strip() for m in self.gemini_fallback_models.split(",") if m.strip()]

    @property
    def datagov_enabled(self) -> bool:
        return bool(self.data_gov_api_key)


# Singleton — import this everywhere
settings = Settings()

