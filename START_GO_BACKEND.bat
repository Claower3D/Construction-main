@echo off
title QAZGOST AI - Golang High-Speed Backend Server
echo ============================================================
echo   Starting QAZGOST AI Golang High-Speed Backend...
echo ============================================================
cd /d "%~dp0\go-backend"
go run ./cmd/server/main.go
pause
