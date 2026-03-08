@echo off
TITLE MC AI Builder Launcher
SETLOCAL

:: Get the directory of the script
SET "PROJECT_DIR=%~dp0"
CD /D "%PROJECT_DIR%"

echo ===========================================
echo    Minecraft AI Builder - Launcher
echo ===========================================
echo.

:: Check for Node.js
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check for node_modules
IF NOT EXIST "node_modules\" (
    echo [INFO] node_modules not found. Running npm install...
    call npm install
)

:: Start the API Server in a new window
echo [1/2] Starting API Backend Server (Port 3001)...
start "MC AI Builder - API Server" cmd /k "title API Server && node server.js"

:: Start the Vite Dev Server in this window
echo [2/2] Starting Vite Frontend...
echo.
echo -------------------------------------------
echo TIP: Once Vite is ready, open the URL below:
echo http://localhost:5173
echo -------------------------------------------
echo.

call npm run dev

pause
