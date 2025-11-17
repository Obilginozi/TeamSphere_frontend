import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
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
