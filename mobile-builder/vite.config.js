import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Приложение «VIP Застройщик» показывает те же экраны, что и модуль «Строительство зданий» на сайте:
// компоненты берутся прямо из ../frontend/src (псевдоним @site), поэтому сайт и приложение не расходятся.
const here = path.dirname(fileURLToPath(import.meta.url));

// Сервер, с которым работает приложение (тот же, что у остальных приложений QazGost)
const API_HOST = 'https://construction-main-production.up.railway.app';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { 'import.meta.env.VITE_API_HOST': JSON.stringify(API_HOST) },
  resolve: {
    alias: [
      { find: '@site', replacement: path.resolve(here, '../frontend/src') },
      // переводы интерфейса в приложение не входят (оно на русском): вместо движка перевода — пустышка
      { find: /^\.\.\/\.\.\/i18n$/, replacement: path.resolve(here, 'src/i18nStub.js') },
    ],
    // React и three — только из этой папки, даже для файлов сайта: иначе в сборку попали бы две копии React
    dedupe: ['react', 'react-dom', 'three'],
  },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false, chunkSizeWarningLimit: 900 },
  server: { port: 5180, host: true, fs: { allow: ['..'] } },
});
