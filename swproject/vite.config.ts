/**
 * @file Vite 빌드 설정
 * @migrated Next.js → Vite + React Router
 * @change next.config.ts → vite.config.ts
 * @change output: 'export' → base: './' (Electron 상대 경로 로드)
 * @change Next.js dev 서버(3000) → Vite dev 서버(5173)
 * @fix Tailwind v3 + PostCSS 방식으로 변경 (@tailwindcss/vite 제거)
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // 일부 라이브러리 호환용 (실제 env는 import.meta.env 사용)
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    // Electron에서 상대 경로로 assets 로드
    base: './',
  };
});
