@echo off
setlocal enabledelayedexpansion

REM ============================================
REM TeamSphere Frontend Requirements Check Script
REM ============================================
REM This script checks system requirements before starting the frontend
REM ============================================

set ERRORS=0
set WARNINGS=0

echo.
echo ============================================
echo TeamSphere Frontend Requirements Check
echo ============================================
echo.

REM Get configuration from environment or use defaults
if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=5173"
if "%BACKEND_PORT%"=="" set "BACKEND_PORT=8080"
if "%VITE_API_BASE_URL%"=="" set "VITE_API_BASE_URL=http://localhost:8080/api"

echo Configuration:
echo   Frontend Port: %FRONTEND_PORT%
echo   Backend Port: %BACKEND_PORT%
echo   API Base URL: %VITE_API_BASE_URL%
echo.

REM 1. Check Node.js installation
echo 1. Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    [ERROR] Node.js is not installed or not in PATH
    echo    Please install Node.js 18+ from: https://nodejs.org/
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo    [OK] Node.js version: %NODE_VERSION%
    REM Basic version check (simplified)
    echo %NODE_VERSION% | findstr /R "^v1[89]\." >nul
    if %ERRORLEVEL% NEQ 0 (
        echo %NODE_VERSION% | findstr /R "^v2[0-9]\." >nul
        if %ERRORLEVEL% NEQ 0 (
            echo    [ERROR] Node.js version %NODE_VERSION% may be too old. Node.js 18+ is required.
            echo    Please upgrade Node.js from: https://nodejs.org/
            set /a ERRORS+=1
        )
    )
)
echo.

REM 2. Check npm installation
echo 2. Checking npm installation...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    [ERROR] npm is not installed or not in PATH
    echo    npm usually comes with Node.js. Please reinstall Node.js.
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo    [OK] npm version: %NPM_VERSION%
)
echo.

REM 3. Check port availability (Frontend)
echo 3. Checking frontend port availability (%FRONTEND_PORT%)...
netstat -an | findstr ":%FRONTEND_PORT%" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    [ERROR] Frontend port %FRONTEND_PORT% is already in use
    echo    Process ID(s) using port %FRONTEND_PORT%:
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%FRONTEND_PORT%" ^| findstr "LISTENING"') do (
        echo      PID: %%p
        set "FRONTEND_PID=%%p"
    )
    echo    Please stop the application using this port or change FRONTEND_PORT environment variable
    echo    To kill the process: taskkill /PID ^<PID^> /F
    set /a ERRORS+=1
) else (
    echo    [OK] Frontend port %FRONTEND_PORT% is available
)
echo.

REM 4. Check backend port availability (optional warning)
echo 4. Checking backend port availability (%BACKEND_PORT%)...
netstat -an | findstr ":%BACKEND_PORT%" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Backend port %BACKEND_PORT% is in use (backend is running)
    echo    Process ID(s) using port %BACKEND_PORT%:
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%BACKEND_PORT%" ^| findstr "LISTENING"') do (
        echo      PID: %%p
        set "BACKEND_PID=%%p"
    )
) else (
    echo    [WARNING] Backend port %BACKEND_PORT% is not in use
    echo    Make sure the backend is running before starting the frontend
    set /a WARNINGS+=1
)
echo.

REM 5. Check project structure
echo 5. Checking project structure...
set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%.."

if not exist "%FRONTEND_DIR%\package.json" (
    echo    [ERROR] package.json not found in %FRONTEND_DIR%
    set /a ERRORS+=1
) else (
    echo    [OK] package.json found
)

if not exist "%FRONTEND_DIR%\vite.config.js" (
    echo    [WARNING] vite.config.js not found
    set /a WARNINGS+=1
) else (
    echo    [OK] vite.config.js found
)

if not exist "%FRONTEND_DIR%\src" (
    echo    [ERROR] src directory not found
    set /a ERRORS+=1
) else (
    echo    [OK] src directory found
)
echo.

REM 6. Check node_modules (optional)
echo 6. Checking dependencies...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo    [WARNING] node_modules directory not found
    echo    Run 'npm install' to install dependencies
    set /a WARNINGS+=1
) else (
    echo    [OK] node_modules directory found
)
echo.

REM 7. Check .env file (optional)
echo 7. Checking environment configuration...
if not exist "%FRONTEND_DIR%\.env" (
    if not exist "%FRONTEND_DIR%\.env.local" (
        echo    [INFO] .env file not found (using defaults)
        echo    Create .env file to customize configuration:
        echo      VITE_API_BASE_URL=http://localhost:8080/api
    ) else (
        echo    [OK] Environment configuration file found (.env.local)
    )
) else (
    echo    [OK] Environment configuration file found (.env)
)
echo.

REM Summary
echo ============================================
echo Summary
echo ============================================
echo Errors: %ERRORS%
echo Warnings: %WARNINGS%
echo.

if %ERRORS% GTR 0 (
    echo CRITICAL ERRORS DETECTED. Please fix the errors before starting the frontend.
    echo.
    echo For detailed error codes and resolutions, see:
    echo   TeamSphere_frontend\scripts\README.md
    exit /b 1
) else if %WARNINGS% GTR 0 (
    echo Warnings detected. Please review them before proceeding.
    exit /b 0
) else (
    echo All checks passed! You can start the frontend now.
    echo.
    echo Next steps:
    echo   1. Install dependencies: cd TeamSphere_frontend ^&^& npm install
    echo   2. Start frontend: cd TeamSphere_frontend ^&^& npm run dev
    echo   3. Access the application: http://localhost:%FRONTEND_PORT%
    echo.
    exit /b 0
)

