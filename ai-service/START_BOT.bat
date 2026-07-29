@echo off
chcp 65001 >nul
title QazGost Telegram Bot

echo ============================================
echo   QazGost AI Telegram Bot
echo ============================================
echo.

cd /d "%~dp0"

:: Проверяем .env
if not exist ".env" (
    echo [WARN] .env не найден, копируем .env.example
    copy .env.example .env >nul 2>&1
)

:: Загружаем TELEGRAM_BOT_TOKEN из .env
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="TELEGRAM_BOT_TOKEN" set TELEGRAM_BOT_TOKEN=%%b
)

if "%TELEGRAM_BOT_TOKEN%"=="" (
    echo [ERROR] TELEGRAM_BOT_TOKEN не задан!
    echo.
    echo Получите токен у @BotFather в Telegram:
    echo   1. Откройте https://t.me/BotFather
    echo   2. /newbot - создайте бота
    echo   3. Скопируйте токен в .env
    echo.
    pause
    exit /b 1
)

:: Активируем venv
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) else (
    echo [WARN] Виртуальное окружение не найдено
    echo Создайте: python -m venv .venv
)

echo [INFO] Запускаем бота...
echo [INFO] AI Service: http://localhost:8001
echo [INFO] Остановка: Ctrl+C
echo.

python -m app.bot

pause
