#!/bin/bash

# ============================================
# TeamSphere Frontend Startup Script
# ============================================

set -e

echo ""
echo "============================================"
echo "TeamSphere Frontend Startup"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH"
    echo "Please install Node.js (which includes npm) from: https://nodejs.org/"
    exit 1
fi

# Navigate to frontend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "[ERROR] Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found in $FRONTEND_DIR"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[WARNING] node_modules directory not found"
    echo "Installing dependencies..."
    npm install
fi

# Get port from environment or use default
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Try to read backend port from .backend-port file (created by backend startup script)
PROJECT_ROOT="$(dirname "$FRONTEND_DIR")"
BACKEND_PORT_FILE="$PROJECT_ROOT/.backend-port"

if [ -f "$BACKEND_PORT_FILE" ]; then
    BACKEND_PORT=$(cat "$BACKEND_PORT_FILE" | tr -d '[:space:]')
    echo "[INFO] Detected backend port from .backend-port file: $BACKEND_PORT"
    export VITE_BACKEND_PORT=$BACKEND_PORT
else
    # Fallback to environment variable or default
    BACKEND_PORT=${BACKEND_PORT:-8080}
    export VITE_BACKEND_PORT=$BACKEND_PORT
    echo "[INFO] Using backend port: $BACKEND_PORT (default or from BACKEND_PORT env)"
fi

echo "Starting TeamSphere Frontend..."
echo "Frontend will be available at: http://localhost:$FRONTEND_PORT"
echo "Backend API should be running at: http://localhost:$BACKEND_PORT/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run development server
npm run dev

