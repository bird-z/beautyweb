import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three.js 仅在首页按需加载，单独成块
  build: { chunkSizeWarningLimit: 700 },
});
