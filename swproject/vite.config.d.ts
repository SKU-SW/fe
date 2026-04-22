/**
 * @file Vite 빌드 설정
 * @migrated Next.js → Vite + React Router
 * @change next.config.ts → vite.config.ts
 * @change output: 'export' → base: './' (Electron 상대 경로 로드)
 * @change Next.js dev 서버(3000) → Vite dev 서버(5173)
 * @fix Tailwind v3 + PostCSS 방식으로 변경 (@tailwindcss/vite 제거)
 */
declare const _default: import("vite").UserConfig;
export default _default;
