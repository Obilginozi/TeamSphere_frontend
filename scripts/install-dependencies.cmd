@echo off
setlocal enabledelayedexpansion

REM ============================================
REM TeamSphere Frontend Dependencies Installation Script
REM ============================================

echo.
echo ============================================
echo TeamSphere Frontend Dependencies Installation
echo ============================================
echo.

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

echo Installing dependencies...
echo This may take a few minutes...
echo.

REM Install dependencies
npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
    echo Next steps:
    echo   1. Start the frontend: npm run dev
    echo   2. Access the application: http://localhost:5173
    echo.
) else (
    echo.
    echo [ERROR] Failed to install dependencies
    echo Please check the error messages above
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo ============================================
echo.
echo Press any key to exit...
pause >nul

exit /b 0

