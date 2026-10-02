import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, /api y /socket.io van a la API local (apps/api)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const api = env.API_URL || 'http://localhost:3077';
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          },
        },
      },
    },
    server: {
      port: 5190,
      strictPort: true,
      proxy: {
        '/api': api,
        '/socket.io': { target: api, ws: true },
      },
    },
  };
});
