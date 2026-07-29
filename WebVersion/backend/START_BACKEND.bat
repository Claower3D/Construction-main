@echo off
echo ================================================
echo   QAZGOST AI Backend Setup
echo ================================================
echo.

cd /d "%~dp0"
cd "..\..\..\Desktop\Моя программа\новая прога от гугла\WebVersion\backend"

echo [1/4] Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found! Install from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [3/4] Checking Docker...
docker --version 2>nul
if errorlevel 1 (
    echo WARNING: Docker not found. Starting server without PostgreSQL/Redis...
    echo Server will run in demo mode (in-memory data)
    echo.
    goto :start_server
)

echo.
echo [4/4] Starting PostgreSQL + Redis...
docker compose up -d postgres redis 2>nul
if errorlevel 1 (
    echo WARNING: Docker compose failed. Starting without DB...
    goto :start_server
)

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo Running database migrations...
call npm run migrate 2>nul
echo Running database seed...
call npm run seed 2>nul

:start_server
echo.
echo ================================================
echo   Starting QAZGOST AI Backend (src/index.js)
echo ================================================
echo.
echo Endpoints:
echo   API:     http://localhost:3001/api/v1
echo   Swagger: http://localhost:3001/api/docs
echo   Health:  http://localhost:3001/health
echo ================================================
echo.

call npm run dev
pause
