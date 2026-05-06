import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite-buildconfig voor deze app (React-plugin voor JSX/HMR).
// Officiële opties: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
