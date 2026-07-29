#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# QAZGOST AI — Docker Setup Script
# Prepares photo3d bundle and starts services
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "═══════════════════════════════════════════════════════"
echo "  QAZGOST AI — Docker Setup"
echo "═══════════════════════════════════════════════════════"

# 1. Prepare photo3d bundle
echo ""
echo "📦 Step 1: Preparing photo3d bundle..."
mkdir -p photo3d_bundle
if [ -f "../WebVersion/backend/photo3d.py" ]; then
    cp ../WebVersion/backend/photo3d.py photo3d_bundle/photo3d.py
    echo "   ✅ photo3d.py copied"
else
    echo "   ⚠️  photo3d.py not found (3D measurements will use mock)"
    touch photo3d_bundle/__init__.py
fi

# 2. Create .env if not exists
echo ""
echo "📝 Step 2: Checking .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "   ✅ Created .env from .env.example"
else
    echo "   ✅ .env already exists"
fi

# 3. Create required directories
echo ""
echo "📂 Step 3: Creating directories..."
mkdir -p models uploads results logs
echo "   ✅ models/ uploads/ results/ logs/"

# 4. Detect GPU
echo ""
echo "🔍 Step 4: Detecting hardware..."
if command -v nvidia-smi &> /dev/null; then
    echo "   ✅ NVIDIA GPU detected"
    GPU_MODE="gpu"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || true
else
    echo "   ⚠️  No NVIDIA GPU — using CPU mode"
    GPU_MODE="cpu"
fi

# 5. Build and start
echo ""
echo "🚀 Step 5: Starting services..."
if [ "$GPU_MODE" = "gpu" ]; then
    echo "   Mode: GPU (ai-service + ollama)"
    docker compose up -d ai-service ollama
else
    echo "   Mode: CPU (ai-service-cpu + ollama-cpu)"
    docker compose --profile cpu up -d
fi

# 6. Wait for health
echo ""
echo "⏳ Step 6: Waiting for services to start..."
echo "   (This may take 1-3 minutes on first run)"
sleep 10

# Check AI service
for i in $(seq 1 30); do
    if curl -sf http://localhost:8001/api/v1/health > /dev/null 2>&1; then
        echo "   ✅ AI Service is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ⚠️  AI Service not ready yet. Check logs: docker compose logs ai-service"
    fi
    sleep 5
done

# Check Ollama
OLLAMA_PORT=${OLLAMA_PORT:-11434}
if curl -sf http://localhost:$OLLAMA_PORT/ > /dev/null 2>&1; then
    echo "   ✅ Ollama is running"
    
    # Check if Qwen model is available
    if curl -sf http://localhost:$OLLAMA_PORT/api/tags | grep -q "qwen"; then
        echo "   ✅ Qwen VLM model is available"
    else
        echo ""
        echo "   📥 Qwen VLM model not found. To install:"
        echo "   docker compose exec ollama ollama pull qwen2.5vl:7b"
        echo "   (or for CPU: docker compose exec ollama-cpu ollama pull qwen2.5vl:7b)"
    fi
else
    echo "   ⚠️  Ollama not ready yet. Check: docker compose logs ollama"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🎉 QAZGOST AI is ready!"
echo ""
echo "  API:     http://localhost:8001"
echo "  Docs:    http://localhost:8001/docs"
echo "  Health:  http://localhost:8001/api/v1/health"
echo "  Ollama:  http://localhost:$OLLAMA_PORT"
echo ""
echo "  Commands:"
echo "    Logs:    docker compose logs -f"
echo "    Stop:    docker compose down"
echo "    Status:  docker compose ps"
echo "═══════════════════════════════════════════════════════"
