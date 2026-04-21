/**
 * @file Vite 앱 엔트리 포인트
 * @migrated Next.js App Router → Vite + React Router
 * @change BrowserRouter → HashRouter (Electron file:// 프로토콜 호환)
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
