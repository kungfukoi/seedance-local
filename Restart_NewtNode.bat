@echo off
setlocal

cd /d "%~dp0"

where powershell >nul 2>nul
if errorlevel 1 (
  echo PowerShell was not found. Please restart NewtNode manually.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Restart_NewtNode.ps1"
