#!/bin/bash

# ============================================
# TeamSphere Frontend Dependencies Installation Script
# ============================================

set -e

echo ""
echo "============================================"
echo "TeamSphere Frontend Dependencies Installation"
echo "============================================"
echo ""

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

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or not in PATH"
    echo "Please install Node.js (which includes npm) from: https://nodejs.org/"
    exit 1
fi

echo "Installing dependencies..."
echo "This may take a few minutes..."
echo ""

# Install dependencies
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESS] Dependencies installed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the frontend: npm run dev"
    echo "  2. Access the application: http://localhost:5173"
    echo ""
else
    echo ""
    echo "[ERROR] Failed to install dependencies"
    echo "Please check the error messages above"
    exit 1
fi

echo "============================================"
echo ""

