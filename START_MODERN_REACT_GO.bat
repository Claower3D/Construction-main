@echo off
chcp 65001 >nul
title QAZGOST AI - Modern Stack (React + Go + Python AI)
echo ============================================================
echo   Starting QAZGOST AI: React 18 + Go Backend + Python AI
echo ============================================================

cd /d "%~dp0"

echo [1/3] Starting Go Server (Port 8080)...
rem Rebuild server.exe from source when Go is installed, so the backend is never stale
where go >nul 2>nul
if %errorlevel%==0 (
    echo       Building fresh server.exe from source...
    pushd "%~dp0go-backend"
    go build -o server.exe ./cmd/server
    if errorlevel 1 echo       [!] Build failed - starting the previous server.exe
    popd
)
if exist "%~dp0go-backend\server.exe" (
    start "QAZGOST AI - Go Backend :8080" /D "%~dp0go-backend" cmd /k "server.exe"
) else (
    echo       [!] go-backend\server.exe not found and Go is not installed.
    echo       Install Go from https://go.dev/dl/ and run this file again.
)

echo [2/3] Starting Python AI Service (Port 8001)...
start "QAZGOST AI - Python AI :8001" /D "%~dp0ai-service" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"

echo [3/3] Starting React Vite Frontend (Port 5173)...
start "QAZGOST AI - React Client :5173" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ============================================================
echo   QAZGOST AI Modern Stack Started!
echo.
echo   - React Frontend : http://localhost:5173
echo   - Go API Backend : http://localhost:8080/health
echo   - Python AI Docs : http://localhost:8001/docs
echo ============================================================
echo.
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173
