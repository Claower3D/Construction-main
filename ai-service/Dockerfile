# ═══════════════════════════════════════════════════════════════════
# QAZGOST AI Service — GPU Dockerfile v3
# Multi-stage build with CUDA for production inference.
# Builder и runtime — один и тот же базовый образ, зависимости в venv /opt/venv
# (раньше пакеты собирались в python:3.11-slim и копировались в Ubuntu — разные сборки Python).
# ═══════════════════════════════════════════════════════════════════

ARG CUDA_IMAGE=nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

# ── Build Stage ────────────────────────────────────────────────────
FROM ${CUDA_IMAGE} AS builder

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 python3.11-venv python3.11-dev build-essential gcc g++ git \
    && rm -rf /var/lib/apt/lists/*

RUN python3.11 -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1

# CUDA 12.1 сборка torch (совпадает с базовым образом)
RUN pip install --upgrade pip && \
    pip install "torch==2.5.1" "torchvision==0.20.1" --index-url https://download.pytorch.org/whl/cu121

WORKDIR /build
COPY requirements.txt .
RUN grep -v -E '^(torch|torchvision)([<>=! ]|$)' requirements.txt > requirements-filtered.txt && \
    pip install -r requirements-filtered.txt && \
    pip install "scipy>=1.12.0"

# ── Production Stage ──────────────────────────────────────────────
FROM ${CUDA_IMAGE}

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 \
        libgl1 \
        libglib2.0-0 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libgomp1 \
        ffmpeg \
        fonts-dejavu-core \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin app

WORKDIR /app

# Copy application code and defect-detector weights (.dockerignore keeps only models/defect_*.pt)
COPY app/ ./app/
COPY models/ ./models/

# Photo3D (SfM) живёт в WebVersion/backend — вне контекста сборки ai-service.
# Чтобы включить /analyze-3d, положите photo3d.py в ai-service/photo3d/ (или задайте PHOTO3D_DIR).

RUN mkdir -p /app/uploads /app/results /app/models /app/logs /app/db /app/data \
    && chown -R app:app /app

ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEVICE=auto \
    HOST=0.0.0.0 \
    PORT=8001 \
    CORS_DEV=false \
    ESTIMATES_DB_PATH=/app/db/estimates.db \
    OLLAMA_HOST=http://ollama:11434 \
    YOLO_CONFIG_DIR=/tmp/ultralytics \
    MPLCONFIGDIR=/tmp/matplotlib \
    LOG_LEVEL=INFO

USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT:-8001}/health" || exit 1

EXPOSE 8001

CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1"]
