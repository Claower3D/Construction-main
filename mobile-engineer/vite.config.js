import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // распознавание трещин работает в отдельном потоке и подгружает onnxruntime динамическим импортом — нужен ES-формат
  worker: { format: 'es' },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5176,
    host: true,
    // модель трещин лежит в папке сайта (../frontend/public/models) — разрешаем dev-серверу её отдавать
    fs: { allow: ['..'] },
  }
});
