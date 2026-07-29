# ═══════════════════════════════════════════════════════════════
# QAZGOST AI — Docker Setup Script (Windows PowerShell)
# Prepares photo3d bundle and starts services
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  QAZGOST AI — Docker Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# 1. Prepare photo3d bundle
Write-Host ""
Write-Host "📦 Step 1: Preparing photo3d bundle..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "photo3d_bundle" -Force | Out-Null
$photo3dSrc = Join-Path $ScriptDir "..\WebVersion\backend\photo3d.py"
if (Test-Path $photo3dSrc) {
    Copy-Item $photo3dSrc -Destination "photo3d_bundle\photo3d.py" -Force
    Write-Host "   ✅ photo3d.py copied" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  photo3d.py not found (3D measurements will use mock)" -ForegroundColor DarkYellow
    New-Item -ItemType File -Path "photo3d_bundle\__init__.py" -Force | Out-Null
}

# 2. Create .env if not exists
Write-Host ""
Write-Host "📝 Step 2: Checking .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" -Destination ".env"
    Write-Host "   ✅ Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "   ✅ .env already exists" -ForegroundColor Green
}

# 3. Create directories
Write-Host ""
Write-Host "📂 Step 3: Creating directories..." -ForegroundColor Yellow
@("models", "uploads", "results", "logs") | ForEach-Object {
    New-Item -ItemType Directory -Path $_ -Force | Out-Null
}
Write-Host "   ✅ models/ uploads/ results/ logs/" -ForegroundColor Green

# 4. Detect GPU
Write-Host ""
Write-Host "🔍 Step 4: Detecting hardware..." -ForegroundColor Yellow
$gpuMode = "cpu"
try {
    $nvidiaInfo = & nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>$null
    if ($LASTEXITCODE -eq 0 -and $nvidiaInfo) {
        Write-Host "   ✅ NVIDIA GPU detected: $nvidiaInfo" -ForegroundColor Green
        $gpuMode = "gpu"
    }
} catch {
    Write-Host "   ⚠️  No NVIDIA GPU — using CPU mode" -ForegroundColor DarkYellow
}

# 5. Build and start
Write-Host ""
Write-Host "🚀 Step 5: Starting services..." -ForegroundColor Yellow
if ($gpuMode -eq "gpu") {
    Write-Host "   Mode: GPU (ai-service + ollama)" -ForegroundColor Green
    docker compose up -d ai-service ollama
} else {
    Write-Host "   Mode: CPU (ai-service-cpu + ollama-cpu)" -ForegroundColor Green
    docker compose --profile cpu up -d
}

# 6. Wait for health
Write-Host ""
Write-Host "⏳ Step 6: Waiting for services to start..." -ForegroundColor Yellow
Write-Host "   (This may take 1-3 minutes on first run)"
Start-Sleep -Seconds 10

# Check AI service
$aiReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:8001/api/v1/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ AI Service is healthy!" -ForegroundColor Green
        $aiReady = $true
        break
    } catch {
        Start-Sleep -Seconds 5
    }
}
if (-not $aiReady) {
    Write-Host "   ⚠️  AI Service not ready. Check: docker compose logs ai-service" -ForegroundColor DarkYellow
}

# Check Ollama
try {
    $ollamaResp = Invoke-RestMethod -Uri "http://localhost:11434/" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ Ollama is running" -ForegroundColor Green

    # Check Qwen model
    $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
    $hasQwen = $tags.models | Where-Object { $_.name -match "qwen" }
    if ($hasQwen) {
        Write-Host "   ✅ Qwen VLM model is available" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "   📥 Qwen VLM model not found. To install:" -ForegroundColor Yellow
        Write-Host "   docker compose exec ollama ollama pull qwen2.5vl:7b" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  Ollama not ready. Check: docker compose logs ollama" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎉 QAZGOST AI is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "  API:     http://localhost:8001" -ForegroundColor White
Write-Host "  Docs:    http://localhost:8001/docs" -ForegroundColor White
Write-Host "  Health:  http://localhost:8001/api/v1/health" -ForegroundColor White
Write-Host "  Ollama:  http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "  Commands:" -ForegroundColor Gray
Write-Host "    Logs:    docker compose logs -f" -ForegroundColor Gray
Write-Host "    Stop:    docker compose down" -ForegroundColor Gray
Write-Host "    Status:  docker compose ps" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
