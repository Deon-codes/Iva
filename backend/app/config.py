"""
Centralised application settings loaded from environment / .env file.
All configuration is typed via pydantic-settings.
Missing optional credentials are logged as warnings — the app still boots
and uses in-memory stubs so tests / local dev work without GCP access.
"""

from __future__ import annotations

import logging
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

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
    gemini_model: str = "gemini-2.0-flash"

    # ── Google Cloud / Firestore ───────────────────────────────────────────────
    google_cloud_project: str = ""
    google_application_credentials: str = ""
    firestore_database_id: str = "(default)"

    # ── Pub/Sub ───────────────────────────────────────────────────────────────
    pubsub_topic: str = "hazela-status-check"

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


# Singleton — import this everywhere
settings = Settings()
