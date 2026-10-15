@echo off
rem Update Deutsch Drill. Double-click, or run .\update.cmd in a terminal. Works even when PowerShell scripts are blocked.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update.ps1" %*
set code=%errorlevel%
pause
exit /b %code%
