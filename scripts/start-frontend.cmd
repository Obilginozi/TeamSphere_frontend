@echo off
setlocal enabledelayedexpansion

REM ============================================
REM TeamSphere Frontend Startup Script
REM ============================================

echo.
echo ============================================
echo TeamSphere Frontend Startup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from: https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo Please install Node.js (which includes npm) from: https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Navigate to frontend directory
set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%.."

cd /d "%FRONTEND_DIR%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot navigate to frontend directory: %FRONTEND_DIR%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found in %FRONTEND_DIR%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules directory not found
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
)

REM Get port from environment or use default
if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=5173"

REM Try to read backend port from .backend-port file (created by backend startup script)
set "PROJECT_ROOT=%FRONTEND_DIR%\.."
set "BACKEND_PORT_FILE=%PROJECT_ROOT%\.backend-port"

if exist "%BACKEND_PORT_FILE%" (
    set /p BACKEND_PORT=<"%BACKEND_PORT_FILE%"
    echo [INFO] Detected backend port from .backend-port file: !BACKEND_PORT!
    set "VITE_BACKEND_PORT=!BACKEND_PORT!"
) else (
    REM Fallback to environment variable or default
    if "%BACKEND_PORT%"=="" set "BACKEND_PORT=8080"
    set "VITE_BACKEND_PORT=%BACKEND_PORT%"
    echo [INFO] Using backend port: %BACKEND_PORT% (default or from BACKEND_PORT env)
)

echo Starting TeamSphere Frontend...
echo Frontend will be available at: http://localhost:%FRONTEND_PORT%
echo Backend API should be running at: http://localhost:%BACKEND_PORT%/api
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run development server
npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to start frontend
    echo Please check the error messages above
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

exit /b 0

