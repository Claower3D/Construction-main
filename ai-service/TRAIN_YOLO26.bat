@echo off
chcp 65001 > nul
title QazGost AI - обучение YOLO26 (дефекты)
setlocal

echo ==========================================================
echo   QazGost AI - обучение детектора дефектов YOLO26
echo   Модель: yolo26s.pt, 120 эпох, imgsz 640, датасет dataset\merged
echo ==========================================================
echo.

cd /d "%~dp0"

echo [1/3] Обновляем ultralytics (YOLO26 нужна версия 8.4+)...
python -m pip install -U ultralytics
if errorlevel 1 (
    echo [ОШИБКА] Не удалось установить ultralytics. Проверьте Python и интернет.
    pause
    exit /b 1
)

echo.
echo [2/3] Проверяем GPU (CUDA)...
set DEVICE=cpu
python -c "import torch,sys; sys.exit(0 if torch.cuda.is_available() else 1)"
if %errorlevel%==0 (
    set DEVICE=0
    python -c "import torch; print('  GPU:', torch.cuda.get_device_name(0))"
) else (
    echo   CUDA недоступна - обучение пойдёт на CPU ^(очень медленно, лимит 6 часов^).
    echo   Для GPU поставьте torch с CUDA: https://pytorch.org/get-started/locally/
)

echo.
echo [3/3] Обучение (device=%DEVICE%)...
if "%DEVICE%"=="cpu" (
    python scripts\train_defects.py --model yolo26s.pt --epochs 120 --imgsz 640 --device cpu --batch 8 --workers 2 --time 6 %*
) else (
    python scripts\train_defects.py --model yolo26s.pt --epochs 120 --imgsz 640 --device 0 --batch 16 %*
)
if errorlevel 1 (
    echo [ОШИБКА] Обучение завершилось с ошибкой.
    pause
    exit /b 1
)

echo.
echo Готово. Веса: models\defect_yolo26_best.pt ^(+ .meta.json с метриками и порогом^)
echo Сервис подхватит их при следующем запуске ^(START_SERVER.bat^).
pause
