# TeamSphere Frontend Scripts

This directory contains utility scripts for TeamSphere frontend development and operations.

## Available Scripts

### Pre-flight Validation

#### `check-requirements.sh` (Mac/Linux)
Comprehensive validation script that checks system requirements before starting the frontend.

**Usage:**
```bash
cd TeamSphere_frontend
./scripts/check-requirements.sh
```

**What it checks:**
- ✅ Node.js 18+ installation and version
- ✅ npm installation
- ✅ Frontend port availability (5173)
- ✅ Backend port availability (8080) - warning if not running
- ✅ Project structure (package.json, vite.config.js, src directory)
- ✅ Dependencies (node_modules directory)
- ✅ Environment configuration (.env file)

#### `check-requirements.cmd` (Windows)
Windows version of the pre-flight validation script.

**Usage:**
```cmd
cd TeamSphere_frontend
scripts\check-requirements.cmd
```

### Dependencies Installation

#### `install-dependencies.sh` (Mac/Linux)
Installs all frontend dependencies using npm.

**Usage:**
```bash
cd TeamSphere_frontend
./scripts/install-dependencies.sh
```

**Features:**
- Checks for npm installation
- Validates package.json exists
- Runs `npm install`
- Provides next steps after installation

#### `install-dependencies.cmd` (Windows)
Windows version of the dependencies installation script.

**Usage:**
```cmd
cd TeamSphere_frontend
scripts\install-dependencies.cmd
```

### Frontend Startup

#### `start-frontend.sh` (Mac/Linux)
Starts the TeamSphere frontend development server.

**Usage:**
```bash
cd TeamSphere_frontend
./scripts/start-frontend.sh
```

**Features:**
- Checks for Node.js and npm installation
- Validates project structure
- Automatically installs dependencies if missing
- Starts Vite development server
- Shows access URLs

#### `start-frontend.cmd` (Windows)
Windows version of the frontend startup script.

**Usage:**
```cmd
cd TeamSphere_frontend
scripts\start-frontend.cmd
```

### Production Build

#### `build-frontend.sh` (Mac/Linux)
Builds the frontend for production deployment.

**Usage:**
```bash
cd TeamSphere_frontend
./scripts/build-frontend.sh
```

**Features:**
- Checks for Node.js and npm installation
- Validates project structure
- Automatically installs dependencies if missing
- Runs production build
- Outputs to `dist` directory

#### `build-frontend.cmd` (Windows)
Windows version of the production build script.

**Usage:**
```cmd
cd TeamSphere_frontend
scripts\build-frontend.cmd
```

### Code Linting

#### `lint-frontend.sh` (Mac/Linux)
Runs ESLint to check code quality and style.

**Usage:**
```bash
cd TeamSphere_frontend
./scripts/lint-frontend.sh
```

**Features:**
- Checks for Node.js and npm installation
- Validates project structure
- Automatically installs dependencies if missing
- Runs ESLint with project configuration

#### `lint-frontend.cmd` (Windows)
Windows version of the linting script.

**Usage:**
```cmd
cd TeamSphere_frontend
scripts\lint-frontend.cmd
```

## Environment Variables

All scripts support environment variables for configuration:

```bash
# Port Configuration
export FRONTEND_PORT=5173
export BACKEND_PORT=8080

# API Configuration
export VITE_API_BASE_URL=http://localhost:8080/api
```

**Windows:**
```cmd
set FRONTEND_PORT=5173
set BACKEND_PORT=8080
set VITE_API_BASE_URL=http://localhost:8080/api
```

## Script Execution Permissions

On Mac/Linux, ensure scripts are executable:
```bash
chmod +x scripts/*.sh
```

## Quick Start Guide

### First Time Setup

1. **Check Requirements:**
   ```bash
   # Mac/Linux
   ./scripts/check-requirements.sh
   
   # Windows
   scripts\check-requirements.cmd
   ```

2. **Install Dependencies:**
   ```bash
   # Mac/Linux
   ./scripts/install-dependencies.sh
   
   # Windows
   scripts\install-dependencies.cmd
   ```

3. **Start Frontend:**
   ```bash
   # Mac/Linux
   ./scripts/start-frontend.sh
   
   # Windows
   scripts\start-frontend.cmd
   ```

### Development Workflow

1. **Start Backend** (in a separate terminal):
   ```bash
   cd TeamSphere_backend
   mvn spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd TeamSphere_frontend
   ./scripts/start-frontend.sh  # Mac/Linux
   # or
   scripts\start-frontend.cmd   # Windows
   ```

3. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080/api
   - Swagger UI: http://localhost:8080/swagger-ui.html

### Production Build

```bash
# Mac/Linux
./scripts/build-frontend.sh

# Windows
scripts\build-frontend.cmd
```

The build output will be in the `dist` directory, ready for deployment.

## Troubleshooting

### Scripts not found
- Ensure you're running scripts from `TeamSphere_frontend` directory
- Use relative paths: `./scripts/script-name.sh` (Mac/Linux) or `scripts\script-name.cmd` (Windows)

### Permission denied (Mac/Linux)
- Make scripts executable: `chmod +x scripts/*.sh`

### Node.js not found
- Install Node.js 18+ from https://nodejs.org/
- Ensure Node.js is added to your PATH

### npm not found
- npm comes with Node.js, reinstall Node.js if npm is missing
- Verify installation: `node -v` and `npm -v`

### Port already in use
- Stop the application using the port
- Change `FRONTEND_PORT` environment variable
- Find and kill the process: `lsof -ti:5173 | xargs kill` (Mac/Linux) or `netstat -ano | findstr :5173` (Windows)

### Dependencies installation fails
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Build fails
- Ensure all dependencies are installed
- Check for TypeScript/ESLint errors
- Review build output for specific error messages

## Related Documentation

- [Frontend README](../README.md) - Main frontend documentation
- [Frontend Developer Guide](../FRONTEND_DEVELOPER_GUIDE.md) - Detailed development guide
- [Backend Scripts](../../TeamSphere_backend/scripts/README.md) - Backend scripts documentation

