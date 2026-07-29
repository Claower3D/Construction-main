# ============================================================
# QAZGOST AI - Startup Script (PowerShell)
# Launches: AI Backend (8001) + Node.js API (3001) + Web (3030)
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "       QAZGOST AI - Full Launcher" -ForegroundColor Cyan
Write-Host "   AI (8001) + API (3001) + Web (3030)" -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""

# -- 1. Check Python --
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $pythonCmd = "python" }
elseif (Get-Command python3 -ErrorAction SilentlyContinue) { $pythonCmd = "python3" }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $pythonCmd = "py" }

if (-not $pythonCmd) {
    Write-Host "  [WARN] Python not found. AI Backend will be skipped." -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Python: $pythonCmd" -ForegroundColor Green
}

# -- 2. Check Node.js --
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  [ERROR] Node.js not found. Install Node.js 18+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
$nodeVer = node --version
Write-Host "  [OK] Node.js: $nodeVer" -ForegroundColor Green

# -- 3. Start AI Backend (port 8001) --
$aiJob = $null
if ($pythonCmd) {
    $aiDir = Join-Path $ROOT "ai-service"
    $venvPython = Join-Path $aiDir "venv\Scripts\python.exe"
    $usePython = $pythonCmd

    if (Test-Path $venvPython) {
        $usePython = $venvPython
        Write-Host "  [OK] venv found" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "  [1/3] Starting AI Backend on http://localhost:8001 ..." -ForegroundColor Yellow

    $aiJob = Start-Job -ScriptBlock {
        param($python, $dir)
        Set-Location $dir
        & $python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload 2>&1
    } -ArgumentList $usePython, $aiDir

    Write-Host "  [OK] AI Backend job started (ID: $($aiJob.Id))" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  [1/3] AI Backend - SKIPPED (no Python)" -ForegroundColor DarkGray
}

# -- 4. Start Node.js API Backend (port 3001) --
Write-Host ""
Write-Host "  [2/3] Starting Node.js API on http://localhost:3001 ..." -ForegroundColor Yellow

$apiDir = Join-Path $ROOT "WebVersion\backend"
$apiJob = $null

if (Test-Path (Join-Path $apiDir "src\index.js")) {
    # Check if node_modules exist
    if (-not (Test-Path (Join-Path $apiDir "node_modules"))) {
        Write-Host "  Installing dependencies..." -ForegroundColor Yellow
        Push-Location $apiDir
        npm install 2>&1 | Out-Null
        Pop-Location
    }

    $apiJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        node src/index.js 2>&1
    } -ArgumentList $apiDir

    Write-Host "  [OK] Node.js API job started (ID: $($apiJob.Id))" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Backend not found at $apiDir - skipped" -ForegroundColor Yellow
}

# -- 5. Wait for services --
Write-Host ""
Write-Host "  Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check AI Backend
if ($aiJob) {
    $aiReady = $false
    for ($i = 0; $i -lt 12; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { $aiReady = $true; break }
        } catch { Start-Sleep -Seconds 2 }
    }
    if ($aiReady) {
        Write-Host "  [OK] AI Backend: ONLINE" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] AI Backend: loading (may take longer for models)" -ForegroundColor Yellow
    }
}

# Check Node.js API
if ($apiJob) {
    $apiReady = $false
    for ($i = 0; $i -lt 5; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { $apiReady = $true; break }
        } catch { Start-Sleep -Seconds 1 }
    }
    if ($apiReady) {
        Write-Host "  [OK] Node.js API: ONLINE" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Node.js API: may need PostgreSQL or config" -ForegroundColor Yellow
    }
}

# -- 6. Start Web Frontend (port 3030) --
Write-Host ""
Write-Host "  [3/3] Starting Web Frontend on http://localhost:3030 ..." -ForegroundColor Yellow

$webDir = Join-Path $ROOT "WebVersion"
$webJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npx -y http-server . -p 3030 -c-1 --cors 2>&1
} -ArgumentList $webDir

Write-Host "  [OK] Web Frontend job started (ID: $($webJob.Id))" -ForegroundColor Green

# -- 7. Summary --
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Green
Write-Host "           QAZGOST AI - Ready!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "   Web App:     http://localhost:3030" -ForegroundColor Green
Write-Host "   Node.js API: http://localhost:3001" -ForegroundColor Green
Write-Host "   AI Backend:  http://localhost:8001" -ForegroundColor Green
Write-Host "   AI Docs:     http://localhost:8001/docs" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Green
Write-Host "  ================================================" -ForegroundColor Green
Write-Host ""

# Open browser
Start-Process "http://localhost:3030"

# -- 8. Keep running, show logs --
Write-Host "  Streaming logs (Ctrl+C to stop):" -ForegroundColor Cyan
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray

try {
    while ($true) {
        if ($aiJob) {
            $aiOutput = Receive-Job -Job $aiJob -ErrorAction SilentlyContinue
            if ($aiOutput) { $aiOutput | ForEach-Object { Write-Host "  [AI]  $_" -ForegroundColor DarkCyan } }
        }

        if ($apiJob) {
            $apiOutput = Receive-Job -Job $apiJob -ErrorAction SilentlyContinue
            if ($apiOutput) { $apiOutput | ForEach-Object { Write-Host "  [API] $_" -ForegroundColor DarkYellow } }
        }

        $webOutput = Receive-Job -Job $webJob -ErrorAction SilentlyContinue
        if ($webOutput) { $webOutput | ForEach-Object { Write-Host "  [WEB] $_" -ForegroundColor DarkGray } }

        # Check if jobs died
        if ($aiJob -and $aiJob.State -eq "Failed") {
            Write-Host "  [ERROR] AI Backend crashed!" -ForegroundColor Red
            Receive-Job -Job $aiJob -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        }
        if ($apiJob -and $apiJob.State -eq "Failed") {
            Write-Host "  [ERROR] Node.js API crashed!" -ForegroundColor Red
            Receive-Job -Job $apiJob -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        }

        Start-Sleep -Seconds 1
    }
} finally {
    # Cleanup on Ctrl+C
    Write-Host ""
    Write-Host "  Stopping all services..." -ForegroundColor Yellow
    if ($aiJob)  { Stop-Job -Job $aiJob  -ErrorAction SilentlyContinue; Remove-Job -Job $aiJob  -Force -ErrorAction SilentlyContinue }
    if ($apiJob) { Stop-Job -Job $apiJob -ErrorAction SilentlyContinue; Remove-Job -Job $apiJob -Force -ErrorAction SilentlyContinue }
    Stop-Job -Job $webJob -ErrorAction SilentlyContinue; Remove-Job -Job $webJob -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] All services stopped." -ForegroundColor Green
}
