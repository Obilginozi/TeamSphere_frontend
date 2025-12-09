import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Function to get backend port from .backend-port file or environment variable
function getBackendPort() {
  // Try to read from .backend-port file (created by backend startup script)
  const projectRoot = path.resolve(__dirname, '..')
  const backendPortFile = path.join(projectRoot, '.backend-port')
  
  if (fs.existsSync(backendPortFile)) {
    try {
      const port = fs.readFileSync(backendPortFile, 'utf-8').trim()
      if (port) {
        return port
      }
    } catch (e) {
      console.warn('[Vite] Could not read .backend-port file:', e.message)
    }
  }
  
  // Fallback to environment variable or default
  return process.env.VITE_BACKEND_PORT || process.env.BACKEND_PORT || '8080'
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
