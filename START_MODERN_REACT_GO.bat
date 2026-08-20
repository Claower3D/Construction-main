@echo off
title QAZGOST AI - Modern Stack (React + Go + Python AI)
echo ============================================================
echo   Starting QAZGOST AI: React 18 + Go Backend + Python AI
echo ============================================================

cd /d "%~dp0"

echo [1/3] Starting Golang High-Speed Server (Port 8080)...
start "QAZGOST AI - Go Backend :8080" cmd /k "cd /d "%~dp0go-backend" && go run ./cmd/server/main.go"

echo [2/3] Starting Python AI Service (Port 8001)...
start "QAZGOST AI - Python AI :8001" cmd /k "cd /d "%~dp0ai-service" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

echo [3/3] Starting React Vite Frontend (Port 5173)...
start "QAZGOST AI - React Client :5173" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ============================================================
echo   🚀 QAZGOST AI Modern Stack Started!
echo.
echo   ► React Frontend : http://localhost:5173
echo   ► Go API Backend : http://localhost:8080/health
echo   ► PriceDB Search : http://localhost:8080/api/v1/prices?q=бетон
echo   ► Python AI Docs : http://localhost:8001/docs
echo ============================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
