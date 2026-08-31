# ── Build stage ───────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt is copied from the repo root by cloudbuild.yaml (see note below)
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Security: run as non-root
RUN groupadd --gid 1001 iva && \
    useradd --uid 1001 --gid 1001 --no-create-home iva

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Cloud Run injects PORT env var; default to 8000
ENV PORT=8000
ENV HOST=0.0.0.0
ENV ENVIRONMENT=production

# Switch to non-root user
USER iva

# Health check (Cloud Run calls /health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

EXPOSE $PORT

# Use exec form so signals are handled properly (graceful shutdown)
CMD ["sh", "-c", "uvicorn app.main:app --host $HOST --port $PORT --workers 1"]
