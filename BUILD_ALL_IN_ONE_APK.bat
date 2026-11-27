@echo off
chcp 65001 >nul
title QazGost - сборка единого APK (6 приложений в одном)
setlocal
set "ROOT=%~dp0"
set "OUT=%USERPROFILE%\Downloads\QazGost-Android"
if not exist "%OUT%" mkdir "%OUT%"

if not defined JAVA_HOME if exist "C:\Program Files\Android\Android Studio\jbr" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if not defined JAVA_HOME if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr" set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"

pushd "%ROOT%mobile-all" || goto :fail
if not exist android\local.properties (echo sdk.dir=C:\\Users\\SystemX\\android-sdk> android\local.properties)
call npm install --no-audit --no-fund || goto :fail
rem собирает 6 приложений в www\ и экран выбора
call npm run build || goto :fail
call npx cap sync android || goto :fail
pushd android
call gradlew.bat assembleDebug || (popd & goto :fail)
copy /y app\build\outputs\apk\debug\app-debug.apk "%OUT%\QazGost-All-v1.4.apk" >nul
popd
popd
echo.
echo   Готово: %OUT%\QazGost-All-v1.4.apk
start "" "%OUT%"
pause
exit /b 0

:fail
popd
echo   ОШИБКА сборки
pause
exit /b 1
