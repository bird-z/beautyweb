import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three.js 仅在首页按需加载，单独成块
  build: { chunkSizeWarningLimit: 700 },
  server: {
    proxy: {
      // dev 时 /api/* 代理到后端，绕过 CORS（localhost:5173 不在后端白名单）
      '/api': {
        target: 'https://manage.bioqif.com',
        changeOrigin: true,  // Host header 改成 manage.bioqif.com
        secure: true,
      },
    },
  },
});
