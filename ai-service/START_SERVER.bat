@echo off
chcp 65001 > nul
title QAZGOST AI Service

echo ==========================================
echo   QAZGOST AI Service - Запуск сервера
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] Проверяем Python...
python --version
if %errorlevel% neq 0 (
    echo ОШИБКА: Python не найден!
    pause
    exit /b 1
)

echo.
echo [2/3] Устанавливаем зависимости...
python -m pip install fastapi "uvicorn[standard]" python-multipart pydantic pydantic-settings pillow numpy loguru requests
if %errorlevel% neq 0 (
    echo ОШИБКА при установке пакетов!
    pause
    exit /b 1
)
echo Зависимости установлены OK

echo.
echo [3/3] Запускаем AI-сервис...
echo.
echo  Сервис: http://localhost:8001
echo  Docs:   http://localhost:8001/docs
echo  Health: http://localhost:8001/api/v1/health
echo.
echo  Ctrl+C чтобы остановить
echo ==========================================
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

pause
