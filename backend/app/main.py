"""
Iva — Agentic Government Schemes & Scholarships Platform
FastAPI application entry point.

Startup sequence:
  1. Load settings from .env
  2. Initialise ADK Runner (builds Gemini agents)
  3. Register all API routers
"""

from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan — startup / shutdown
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iva starting up (environment=%s)", settings.environment)
    # Initialise ADK runner once at startup (creates agents, ADK sessions)
    from agents.runner import iva_runner
    iva_runner.initialise()
    logger.info("ADK Runner ready.")
    yield
    logger.info("Iva shutting down.")


# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Iva API",
    description=(
        "Agentic platform for discovering, verifying, and applying for Indian government "
        "schemes and scholarships. Built with Gemini + Google ADK for the Google "
        "All Things Agentic Hackathon."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Attach a unique request ID for tracing."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ─────────────────────────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────────────────────────

from app.routes import chat, profile, schemes, applications, voice, documents, status_trigger  # noqa: E402

app.include_router(chat.router)
app.include_router(profile.router)
app.include_router(schemes.router)
app.include_router(applications.router)
app.include_router(voice.router)
app.include_router(documents.router)
app.include_router(status_trigger.router)


# ─────────────────────────────────────────────────────────────────────────────
# Core endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"], summary="Health check")
def health_check():
    """Health check endpoint — required for Cloud Run liveness probes."""
    return {
        "status": "ok",
        "environment": settings.environment,
        "gemini_enabled": settings.gemini_enabled,
        "firestore_enabled": settings.firestore_enabled,
    }


@app.get("/", tags=["system"], include_in_schema=False)
def root():
    return {"message": "Iva API is running. Visit /docs for the API reference."}


# ─────────────────────────────────────────────────────────────────────────────
# Dev entrypoint
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
