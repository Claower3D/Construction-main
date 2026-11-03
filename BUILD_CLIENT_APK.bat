@echo off
chcp 65001 >nul
title QazGost Client - сборка APK
echo ============================================================
echo   Сборка Android-приложения «QazGost Клиент» (APK)
echo ============================================================
cd /d "%~dp0mobile-customer"

rem Java 17 из Android Studio, если JAVA_HOME не задан
if not defined JAVA_HOME if exist "C:\Program Files\Android\Android Studio\jbr" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
if not defined JAVA_HOME if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr" set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"

rem путь к Android SDK
if not exist android\local.properties (
  if defined ANDROID_HOME (echo sdk.dir=%ANDROID_HOME:\=\\%> android\local.properties) else (echo sdk.dir=C:\\Users\\SystemX\\android-sdk> android\local.properties)
)

echo [1/4] npm install...
call npm install --no-audit --no-fund || goto :err
echo [2/4] Сборка интерфейса...
call npm run build || goto :err
echo [3/4] Перенос в Android-проект...
call npx cap sync android || goto :err
echo [4/4] Gradle assembleDebug...
cd android
call gradlew.bat assembleDebug || goto :err
copy /y app\build\outputs\apk\debug\app-debug.apk "%~dp0QazGost-Client-v1.0.apk" >nul
echo.
echo ============================================================
echo   Готово: %~dp0QazGost-Client-v1.0.apk
echo   Скиньте файл на телефон и установите.
echo ============================================================
pause
exit /b 0

:err
echo.
echo Сборка остановилась с ошибкой. Пришлите скриншот этого окна.
pause
exit /b 1
