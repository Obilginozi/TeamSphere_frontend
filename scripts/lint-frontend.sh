#!/bin/bash

# ============================================
# TeamSphere Frontend Lint Script
# ============================================

set -e

echo ""
echo "============================================"
echo "TeamSphere Frontend Linting"
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

echo "Running ESLint..."
echo ""

# Run lint
npm run lint

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESS] Linting completed successfully!"
    echo ""
else
    echo ""
    echo "[ERROR] Linting failed"
    echo "Please fix the linting errors above"
    exit 1
fi

echo "============================================"
echo ""

