@echo off
chcp 65001 > nul
title QazGost AI - обучение своей модели дефектов
setlocal
cd /d "%~dp0"

echo ==============================================================
echo   QazGost AI - обучение своей модели дефектов
echo   Трещины, сколы, оголённая арматура, коррозия, высолы, пятна
echo   Окно не закрывайте. Журнал: runs\qazgost_v2\train_log.txt
echo ==============================================================
echo.

python --version
if errorlevel 1 goto nopython

echo.
echo [1/3] Видеокарта...
set HASGPU=0
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>nul
if not errorlevel 1 set HASGPU=1
if "%HASGPU%"=="0" echo   Видеокарта NVIDIA не найдена - обучение пойдёт на процессоре, это медленно.

echo.
echo [2/3] Библиотеки...
python -m pip install -q -U ultralytics roboflow onnx onnxslim onnxruntime
if errorlevel 1 goto piperror
if "%HASGPU%"=="0" goto train
python -c "import torch,sys; sys.exit(0 if torch.cuda.is_available() else 1)" 2>nul
if not errorlevel 1 goto train
echo   Ставлю PyTorch с поддержкой видеокарты. Скачивание около 2,5 ГБ, один раз.
python -m pip install -U torch torchvision --index-url https://download.pytorch.org/whl/cu124
python -c "import torch,sys; sys.exit(0 if torch.cuda.is_available() else 1)" 2>nul
if errorlevel 1 echo   Видеокарту подключить не удалось - обучение пойдёт на процессоре.

:train
echo.
echo [3/3] Обучение...
python scripts\train_qazgost.py %*
if errorlevel 1 goto trainerror
echo.
echo Готово. Отчёт: runs\qazgost_v2\REPORT.json, модели: models\export
echo Напишите Claude, что обучение закончилось - он проверит модель и поставит её на сайт.
pause
exit /b 0

:nopython
echo [ОШИБКА] Python не найден. Установите Python 3.10-3.12 с python.org и отметьте "Add to PATH".
pause
exit /b 1

:piperror
echo [ОШИБКА] Не удалось установить библиотеки. Проверьте интернет и запустите ещё раз.
pause
exit /b 1

:trainerror
echo.
echo [ОШИБКА] Обучение не завершилось. Журнал: runs\qazgost_v2\train_log.txt
echo Чтобы продолжить с места остановки: TRAIN_QAZGOST.bat --resume
pause
exit /b 1
