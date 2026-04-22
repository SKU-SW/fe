import { Wifi, WifiOff, TrendingUp, Clock } from "lucide-react";

export function ConnectionStatusBar() {
  // Mock data - 실제로는 props나 context에서 가져올 데이터
  const connections = [
    { name: '트위치', connected: true, icon: '🟣' },
    { name: '치지직', connected: true, icon: '🟢' },
    { name: '유튜브', connected: false, icon: '🔴' },
  ];

  const stats = {
    analyzed: 198,
    filtered: 49,
    latency: 12,
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        {/* 채팅 소스 연결 상태 */}
        <div className="flex items-center gap-6">
          <span className="text-xs text-slate-400 font-medium">채팅 소스:</span>
          {connections.map((conn) => (
            <div key={conn.name} className="flex items-center gap-2">
              <span className="text-sm">{conn.icon}</span>
              <span className={`text-sm ${conn.connected ? 'text-green-400' : 'text-slate-500'}`}>
                {conn.name}
              </span>
              {conn.connected ? (
                <Wifi className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>
          ))}
        </div>

        {/* 실시간 통계 */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">
              분석 <span className="text-blue-400 font-semibold">{stats.analyzed}</span>개
            </span>
            <span className="text-xs text-slate-500">/ 봇 제외 {stats.filtered}개</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">
              처리 지연: <span className="text-green-400 font-semibold">{stats.latency}ms</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
