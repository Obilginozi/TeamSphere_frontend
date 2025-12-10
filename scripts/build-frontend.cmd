@echo off
setlocal enabledelayedexpansion

REM ============================================
REM TeamSphere Frontend Build Script
REM ============================================

echo.
echo ============================================
echo TeamSphere Frontend Build
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

echo Building frontend for production...
echo This may take a few minutes...
echo.

REM Run build
npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Frontend built successfully!
    echo.
    echo Build output is in the 'dist' directory
    echo.
    echo Next steps:
    echo   1. Preview the build: npm run preview
    echo   2. Deploy the 'dist' directory to your web server
    echo.
) else (
    echo.
    echo [ERROR] Build failed
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

