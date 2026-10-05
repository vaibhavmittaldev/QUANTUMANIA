import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8001'

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true
      },
      '/auth': {
        target: BACKEND_URL,
        changeOrigin: true
      },
      '/me': {
        target: BACKEND_URL,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 3001,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true
      },
      '/auth': {
        target: BACKEND_URL,
        changeOrigin: true
      },
      '/me': {
        target: BACKEND_URL,
        changeOrigin: true
      }
    }
  }
})
