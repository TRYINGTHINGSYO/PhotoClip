@echo off
title Photo Clip Server
color 0A

echo.
echo  ==========================================
echo   Photo Clip Server - Starting...
echo  ==========================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js is not installed!
    echo  Download it from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Go to the folder this batch file is in
cd /d "%~dp0"

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    echo.
)

echo  Starting server...
echo  Keep this window open while using the app.
echo  Press Ctrl+C to stop.
echo.

node server.js

pause
