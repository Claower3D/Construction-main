import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// Dev-proxy target. Default = production on Railway (as configured locally),
// override for a local stack:  VITE_PROXY_TARGET=http://localhost:8080 npm run dev
// NOTE: with the default, `npm run dev` reads/writes the PRODUCTION database.
const API_TARGET = process.env.VITE_PROXY_TARGET || 'https://construction-main-production.up.railway.app'
// /api/v1/defect-scan goes through the Go proxy unless a direct AI-service URL is given
const AI_TARGET = process.env.VITE_AI_PROXY_TARGET || API_TARGET

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Direct proxy to Python AI service (bypass Go for defect scanning)
      '/api/v1/defect-scan': {
        target: AI_TARGET,
        changeOrigin: true,
        secure: API_TARGET.startsWith('https'),
      },
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: API_TARGET.startsWith('https'),
      },
      '/health': {
        target: API_TARGET,
        changeOrigin: true,
        secure: API_TARGET.startsWith('https'),
      },
      '/ai-service': {
        target: AI_TARGET,
        changeOrigin: true,
        secure: API_TARGET.startsWith('https'),
        rewrite: (path) => path.replace(/^\/ai-service/, ''),
      },
      '/uploads': {
        target: API_TARGET,
        changeOrigin: true,
        secure: API_TARGET.startsWith('https'),
      },
    },
  },
});
