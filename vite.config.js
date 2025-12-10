import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Function to validate port number
function isValidPort(port) {
  const portNum = parseInt(port, 10)
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535
}

// Function to get backend port from .backend-port file or environment variable
function getBackendPort() {
  // Try multiple possible locations for .backend-port file
  // This makes it more robust across different project structures and execution contexts
  const possiblePaths = [
    // Standard location: project root (one level up from TeamSphere_frontend)
    path.resolve(__dirname, '..', '.backend-port'),
    // Alternative: current working directory
    path.resolve(process.cwd(), '.backend-port'),
    // Alternative: from TeamSphere_frontend directory
    path.resolve(__dirname, '.backend-port'),
  ]
  
  // Try to read from .backend-port file (created by backend startup script)
  for (const backendPortFile of possiblePaths) {
    if (fs.existsSync(backendPortFile)) {
      try {
        // Check file permissions before reading
        fs.accessSync(backendPortFile, fs.constants.R_OK)
        const port = fs.readFileSync(backendPortFile, 'utf-8').trim()
        if (port && isValidPort(port)) {
          console.log(`[Vite] Using backend port from .backend-port file (${backendPortFile}): ${port}`)
          return port
        } else if (port) {
          console.warn(`[Vite] Invalid port number in .backend-port file: "${port}". Trying next location or fallback.`)
        }
      } catch (e) {
        // File exists but can't be read (permission issue or other error)
        console.warn(`[Vite] Could not read .backend-port file at ${backendPortFile}:`, e.message)
        // Continue to next possible path
        continue
      }
    }
  }
  
  // If we get here, no valid .backend-port file was found
  console.log('[Vite] .backend-port file not found in any expected location.')
  console.log('[Vite] This is normal if backend has not been started yet.')
  console.log('[Vite] Using fallback port. Backend port will be detected automatically when backend starts.')
  
  // Fallback to environment variable or default
  const fallbackPort = process.env.VITE_BACKEND_PORT || process.env.BACKEND_PORT || '8080'
  if (isValidPort(fallbackPort)) {
    return fallbackPort
  }
  
  console.warn(`[Vite] Invalid fallback port: "${fallbackPort}". Using default port 8080.`)
  return '8080'
}

const backendPort = getBackendPort()
const backendUrl = `http://localhost:${backendPort}`

console.log(`[Vite] Using backend URL: ${backendUrl}`)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        // Backend has context-path: /api, so we need to forward /api to /api
        // Don't rewrite the path, just forward as-is
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
