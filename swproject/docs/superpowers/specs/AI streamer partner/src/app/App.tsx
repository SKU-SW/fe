import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { ChatAnalysis } from "./components/ChatAnalysis";
import { SafetyManagement } from "./components/SafetyManagement";
import { AICharacter } from "./components/AICharacter";
import { ResponseLog } from "./components/ResponseLog";
import { GameIntegration } from "./components/GameIntegration";
import { AuthPage } from "./components/AuthPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="size-full flex bg-slate-950">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'chat' && <ChatAnalysis />}
        {activeTab === 'character' && <AICharacter />}
        {activeTab === 'safety' && <SafetyManagement />}
        {activeTab === 'logs' && <ResponseLog />}
        {activeTab === 'game' && <GameIntegration />}
        {activeTab !== 'dashboard' && activeTab !== 'chat' && activeTab !== 'character' && activeTab !== 'safety' && activeTab !== 'logs' && activeTab !== 'game' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-slate-400">
              <p className="text-xl mb-2">{activeTab} 페이지</p>
              <p className="text-sm">준비 중입니다</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}