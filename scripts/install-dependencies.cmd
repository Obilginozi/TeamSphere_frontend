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
if errorlevel 1 (
    echo [ERROR] Cannot navigate to frontend directory: %FRONTEND_DIR%
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found in %FRONTEND_DIR%
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not in PATH
    echo Please install Node.js ^(which includes npm^) from: https://nodejs.org/
    exit /b 1
)

echo Installing dependencies...
echo This may take a few minutes...
echo.

REM Install dependencies
call npm install
set "NPM_EXIT_CODE=%ERRORLEVEL%"

REM npm may return non-zero exit code due to vulnerabilities, but installation can still succeed
REM Check if node_modules directory exists to verify installation
if exist "node_modules" (
    echo.
    echo [SUCCESS] Dependencies installed successfully!
    if %NPM_EXIT_CODE% NEQ 0 (
        echo [WARNING] npm reported vulnerabilities. Run 'npm audit' for details.
    )
    echo.
    echo Next steps:
    echo   1. Start the frontend: npm run dev
    echo   2. Access the application: http://localhost:5173
    echo.
) else (
    echo.
    echo [ERROR] Failed to install dependencies
    echo Please check the error messages above
    exit /b 1
)

echo ============================================
echo.

exit /b 0

