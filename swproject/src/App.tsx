/**
 * @file 앱 라우트 정의
 * @migrated Next.js App Router 구조 → React Router v7 declarative routes
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import CharacterPage from './pages/CharacterPage';
import ChatAnalysisPage from './pages/ChatAnalysisPage';
import ProactivePage from './pages/ProactivePage';
import GamePage from './pages/GamePage';
import SafetyPage from './pages/SafetyPage';
import SettingsPage from './pages/SettingsPage';
import StatsPage from './pages/StatsPage';

// Standalone Pages
import OverlayPage from './pages/OverlayPage';

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth routes (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Dashboard routes (with layout) */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/character" element={<CharacterPage />} />
        <Route path="/chat-analysis" element={<ChatAnalysisPage />} />
        <Route path="/proactive" element={<ProactivePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Route>

      {/* Overlay (standalone, transparent) */}
      <Route path="/overlay" element={<OverlayPage />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
