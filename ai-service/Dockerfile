# ═══════════════════════════════════════════════════════════════════
# QAZGOST AI Service — GPU Dockerfile v2
# Multi-stage build with CUDA for production inference
# ═══════════════════════════════════════════════════════════════════

# ── Build Stage ────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Also install scipy for photo3d
RUN pip install --no-cache-dir --user scipy>=1.12.0

# ── Production Stage ──────────────────────────────────────────────
FROM nvidia/cuda:11.8-cudnn8-runtime-ubuntu22.04

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    python3.11-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3.11 /usr/bin/python

WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY app/ ./app/
COPY data/ ./data/

# Copy photo3d module
COPY photo3d_bundle/ ./photo3d/

# Create directories
RUN mkdir -p /app/uploads /app/results /app/models /app/logs

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEVICE=auto \
    HOST=0.0.0.0 \
    PORT=8001 \
    OLLAMA_HOST=http://ollama:11434 \
    LOG_LEVEL=INFO

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8001/api/v1/health || exit 1

EXPOSE 8001

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
