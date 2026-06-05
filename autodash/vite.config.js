import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vite-buildconfig voor deze app (React-plugin voor JSX/HMR).
// Officiële opties: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'recharts'
          if (id.includes('node_modules/@fortawesome')) return 'icons'
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
  server: {
    proxy: {
      // Zelfde origin als `/api` zodat `fetch('/health')` in dev de Express-backend bereikt.
      '/health': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
