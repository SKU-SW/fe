import { Bot, MessageSquare, Settings as SettingsIcon, Shield, FileText, Gamepad2, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeTab, onTabChange, isCollapsed, onToggle }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: Bot },
    { id: 'chat', label: '채팅 분석', icon: MessageSquare },
    { id: 'character', label: 'AI 캐릭터', icon: SettingsIcon },
    { id: 'donation', label: '도네이션', icon: DollarSign },
    { id: 'game', label: '게임 연동', icon: Gamepad2 },
    { id: 'safety', label: '안전 관리', icon: Shield },
    { id: 'logs', label: '응답 로그', icon: FileText },
  ];

  return (
    <div className={`bg-slate-900 border-r border-slate-700 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold">AI Streamer</h1>
                <p className="text-xs text-slate-400">동료 시스템</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                data-tab={item.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        {!isCollapsed && (
          <div className="text-xs text-slate-400 space-y-1 mb-3">
            <div className="flex justify-between">
              <span>상태:</span>
              <span className="text-green-400">정상</span>
            </div>
            <div className="flex justify-between">
              <span>버전:</span>
              <span>v1.0.0</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full p-2 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
          title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
}