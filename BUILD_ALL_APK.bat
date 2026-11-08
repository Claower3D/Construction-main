@echo off
chcp 65001 >nul
title QazGost - сборка всех APK
setlocal EnableDelayedExpansion
set "ROOT=%~dp0"
set "OUT=%USERPROFILE%\Downloads\QazGost-APK"
if not exist "%OUT%" mkdir "%OUT%"

if not defined JAVA_HOME if exist "C:\Program Files\Android\Android Studio\jbr" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if not defined JAVA_HOME if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr" set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"

set FAILED=
call :build mobile-customer QazGost-Client-v1.0
call :build mobile-manager QazGost-Manager-CRM-v2.1
call :build mobile-engineer QazGost-Engineer-v2.1
call :build mobile-executor QazGost-Executor-v2.1

echo.
echo ============================================================
if defined FAILED (echo   Не собрались:!FAILED!) else (echo   Все 4 APK собраны.)
echo   Папка: %OUT%
echo ============================================================
start "" "%OUT%"
pause
exit /b 0

:build
echo.
echo ===== %1 =====
pushd "%ROOT%%1" || (set "FAILED=!FAILED! %1" & exit /b 1)
if not exist android\local.properties (echo sdk.dir=C:\\Users\\SystemX\\android-sdk> android\local.properties)
call npm install --no-audit --no-fund || goto :fail
call npm run build || goto :fail
call npx cap sync android || goto :fail
pushd android
call gradlew.bat assembleDebug || (popd & goto :fail)
copy /y app\build\outputs\apk\debug\app-debug.apk "%OUT%\%2.apk" >nul
popd
popd
echo   OK: %2.apk
exit /b 0
:fail
popd
set "FAILED=!FAILED! %1"
echo   ОШИБКА: %1
exit /b 1
