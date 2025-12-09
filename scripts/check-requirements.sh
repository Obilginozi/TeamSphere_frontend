#!/bin/bash

# ============================================
# TeamSphere Frontend Requirements Check Script
# ============================================
# This script checks system requirements before starting the frontend
# ============================================

set -e

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "============================================"
echo "TeamSphere Frontend Requirements Check"
echo "============================================"
echo ""

# Get configuration from environment or use defaults
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_PORT=${BACKEND_PORT:-8080}
API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:8080/api}

echo "Configuration:"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Backend Port: $BACKEND_PORT"
echo "  API Base URL: $API_BASE_URL"
echo ""

# 1. Check Node.js installation
echo "1. Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "   ${RED}[ERROR]${NC} Node.js is not installed or not in PATH"
    echo "   Please install Node.js 18+ from: https://nodejs.org/"
    ((ERRORS++))
else
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "   ${RED}[ERROR]${NC} Node.js version is $NODE_VERSION. Node.js 18+ is required."
        echo "   Please upgrade Node.js from: https://nodejs.org/"
        ((ERRORS++))
    else
        echo -e "   ${GREEN}[OK]${NC} Node.js version: $NODE_VERSION"
    fi
fi
echo ""

# 2. Check npm installation
echo "2. Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo -e "   ${RED}[ERROR]${NC} npm is not installed or not in PATH"
    echo "   npm usually comes with Node.js. Please reinstall Node.js."
    ((ERRORS++))
else
    NPM_VERSION=$(npm -v)
    echo -e "   ${GREEN}[OK]${NC} npm version: $NPM_VERSION"
fi
echo ""

# 3. Check port availability (Frontend)
echo "3. Checking frontend port availability ($FRONTEND_PORT)..."
PIDS=$(lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t 2>/dev/null)
if [ -n "$PIDS" ]; then
    PID_LIST=$(echo "$PIDS" | tr '\n' ' ' | sed 's/ $//')
    echo -e "   ${RED}[ERROR]${NC} Frontend port $FRONTEND_PORT is already in use"
    echo "   Process ID(s) using port $FRONTEND_PORT: $PID_LIST"
    echo "   Please stop the application using this port or change FRONTEND_PORT environment variable"
    echo "   To kill the process: lsof -ti:$FRONTEND_PORT | xargs kill -9"
    ((ERRORS++))
else
    echo -e "   ${GREEN}[OK]${NC} Frontend port $FRONTEND_PORT is available"
fi
echo ""

# 4. Check backend port availability (optional warning)
echo "4. Checking backend port availability ($BACKEND_PORT)..."
BACKEND_PIDS=$(lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t 2>/dev/null)
if [ -n "$BACKEND_PIDS" ]; then
    BACKEND_PID_LIST=$(echo "$BACKEND_PIDS" | tr '\n' ' ' | sed 's/ $//')
    echo -e "   ${GREEN}[OK]${NC} Backend port $BACKEND_PORT is in use (backend is running)"
    echo "   Process ID(s) using port $BACKEND_PORT: $BACKEND_PID_LIST"
else
    echo -e "   ${YELLOW}[WARNING]${NC} Backend port $BACKEND_PORT is not in use"
    echo "   Make sure the backend is running before starting the frontend"
    ((WARNINGS++))
fi
echo ""

# 5. Check project structure
echo "5. Checking project structure..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$FRONTEND_DIR/package.json" ]; then
    echo -e "   ${RED}[ERROR]${NC} package.json not found in $FRONTEND_DIR"
    ((ERRORS++))
else
    echo -e "   ${GREEN}[OK]${NC} package.json found"
fi

if [ ! -f "$FRONTEND_DIR/vite.config.js" ]; then
    echo -e "   ${YELLOW}[WARNING]${NC} vite.config.js not found"
    ((WARNINGS++))
else
    echo -e "   ${GREEN}[OK]${NC} vite.config.js found"
fi

if [ ! -d "$FRONTEND_DIR/src" ]; then
    echo -e "   ${RED}[ERROR]${NC} src directory not found"
    ((ERRORS++))
else
    echo -e "   ${GREEN}[OK]${NC} src directory found"
fi
echo ""

# 6. Check node_modules (optional)
echo "6. Checking dependencies..."
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "   ${YELLOW}[WARNING]${NC} node_modules directory not found"
    echo "   Run 'npm install' to install dependencies"
    ((WARNINGS++))
else
    echo -e "   ${GREEN}[OK]${NC} node_modules directory found"
fi
echo ""

# 7. Check .env file (optional)
echo "7. Checking environment configuration..."
if [ ! -f "$FRONTEND_DIR/.env" ] && [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo -e "   ${YELLOW}[INFO]${NC} .env file not found (using defaults)"
    echo "   Create .env file to customize configuration:"
    echo "     VITE_API_BASE_URL=http://localhost:8080/api"
else
    echo -e "   ${GREEN}[OK]${NC} Environment configuration file found"
fi
echo ""

# Summary
echo "============================================"
echo "Summary"
echo "============================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}CRITICAL ERRORS DETECTED. Please fix the errors before starting the frontend.${NC}"
    echo ""
    echo "For detailed error codes and resolutions, see:"
    echo "  TeamSphere_frontend/scripts/README.md"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings detected. Please review them before proceeding.${NC}"
    exit 0
else
    echo -e "${GREEN}All checks passed! You can start the frontend now.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Install dependencies: cd TeamSphere_frontend && npm install"
    echo "  2. Start frontend: cd TeamSphere_frontend && npm run dev"
    echo "  3. Access the application: http://localhost:$FRONTEND_PORT"
    echo ""
    exit 0
fi

