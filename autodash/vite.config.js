import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite-buildconfig voor deze app (React-plugin voor JSX/HMR).
// Officiële opties: https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
