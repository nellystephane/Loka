import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Loka/' : '/',
  server: {
    proxy: {
      '/api': {
        target: process.env.LOKA_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.LOKA_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}));
