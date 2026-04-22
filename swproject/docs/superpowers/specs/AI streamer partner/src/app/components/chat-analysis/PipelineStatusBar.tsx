import { Wifi, WifiOff, Shield, Clock, ArrowRight } from 'lucide-react';
import chzzkLogo from 'figma:asset/3e63027ddd4420a16829b68b38cfbacf5da220fa.png';
import soopLogo from 'figma:asset/ed8a3b0f34aca3564311231f923fc68079e7fd4d.png';

interface ChatSource {
  name: string;
  logo: string;
  connected: boolean;
}

export function PipelineStatusBar() {
  const chatSources: ChatSource[] = [
    { name: '치지직', logo: chzzkLogo, connected: true },
    { name: 'SOOP', logo: soopLogo, connected: false },
  ];

  const stats = {
    totalChats: 1847,
    filteredChats: 243,
    processingLatency: 12,
  };

  const activeSafetyFilters = ['혐오 표현', '개인정보'];

  const handleNavigateToSafety = () => {
    // Navigate to safety page by dispatching a custom event
    const sidebar = document.querySelector('[data-tab="safety"]') as HTMLElement;
    if (sidebar) {
      sidebar.click();
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="grid grid-cols-4 gap-6">
        {/* 채팅 소스 연결 상태 */}
        <div>
          <p className="text-xs text-slate-400 mb-3 font-medium">채팅 소스 연결</p>
          <div className="flex gap-2">
            {chatSources.map((source) => (
              <div
                key={source.name}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                  source.connected
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-700/50 border-slate-600'
                }`}
              >
                <img src={source.logo} alt={source.name} className="w-4 h-4 object-contain" />
                <span className={`text-xs font-medium ${
                  source.connected ? 'text-green-400' : 'text-slate-500'
                }`}>
                  {source.name}
                </span>
                {source.connected ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-slate-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 채팅 수신/필터링 통계 */}
        <div>
          <p className="text-xs text-slate-400 mb-3 font-medium">채팅 통계</p>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-slate-500">전체 수신</p>
              <p className="text-xl font-semibold text-white">{stats.totalChats}</p>
            </div>
            <div className="text-slate-600">→</div>
            <div>
              <p className="text-xs text-slate-500">필터링</p>
              <p className="text-xl font-semibold text-red-400">{stats.filteredChats}</p>
            </div>
            <div className="text-xs text-slate-400 ml-2">
              ({Math.round((stats.filteredChats / stats.totalChats) * 100)}% 차단)
            </div>
          </div>
        </div>

        {/* 안전 필터 요약 */}
        <div>
          <p className="text-xs text-slate-400 mb-3 font-medium">활성 안전 필터</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">{activeSafetyFilters.length}개 활성</span>
            </div>
            <button
              onClick={handleNavigateToSafety}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-700 rounded transition-colors"
            >
              <span className="text-xs text-slate-400">설정 변경</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <div className="mt-1 flex gap-1">
            {activeSafetyFilters.map((filter) => (
              <span key={filter} className="text-xs text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded">
                {filter}
              </span>
            ))}
          </div>
        </div>

        {/* 시스템 지연 */}
        <div>
          <p className="text-xs text-slate-400 mb-3 font-medium">처리 성능</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            <div>
              <p className="text-xs text-slate-500">평균 지연</p>
              <p className="text-xl font-semibold text-green-400">{stats.processingLatency}ms</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">실시간 처리 중</span>
          </div>
        </div>
      </div>
    </div>
  );
}