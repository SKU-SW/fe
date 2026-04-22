import { useState } from "react";
import { Pause, Play, Mic } from "lucide-react";

export function QuickControlBar() {
  const [isPaused, setIsPaused] = useState(false);
  const [activePersona, setActivePersona] = useState<string>('default');
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [isPTTEnabled, setIsPTTEnabled] = useState(true); // AI 캐릭터 페이지에서 설정한 값 가져올 예정

  // 나중에 AI 캐릭터 페이지에서 설정한 페르소나들을 가져올 예정
  const personas = [
    { id: 'default', name: '기본 캐릭터', emoji: '😊' },
    { id: 'energetic', name: '활발한 성격', emoji: '⚡' },
    { id: 'calm', name: '차분한 성격', emoji: '🌙' },
    { id: 'funny', name: '유머러스', emoji: '🎭' },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* AI 일시정지 버튼 */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isPaused
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
      >
        {isPaused ? (
          <>
            <Play className="w-4 h-4" />
            <span className="text-sm">재개</span>
          </>
        ) : (
          <>
            <Pause className="w-4 h-4" />
            <span className="text-sm">일시정지</span>
          </>
        )}
      </button>

      {/* PTT 상태 인디케이터 */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
        !isPTTEnabled 
          ? 'bg-slate-800 border-slate-700 opacity-50'
          : isPTTActive
            ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20 animate-pulse-border'
            : 'bg-slate-700 border-slate-600'
      }`}>
        <Mic className={`w-4 h-4 transition-colors ${
          !isPTTEnabled
            ? 'text-slate-500'
            : isPTTActive
              ? 'text-blue-400'
              : 'text-slate-400'
        }`} />
        <div>
          <div className={`text-xs font-medium ${
            !isPTTEnabled
              ? 'text-slate-500'
              : isPTTActive
                ? 'text-blue-400'
                : 'text-slate-300'
          }`}>
            {!isPTTEnabled ? 'PTT 비활성화' : isPTTActive ? '음성 인식 중' : '대기 중'}
          </div>
          {isPTTEnabled && (
            <div className="text-xs text-slate-500">
              {isPTTActive ? '단축키 누르는 중...' : 'F1 누르세요'}
            </div>
          )}
        </div>
      </div>

      {/* 캐릭터 페르소나 ��택 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 mr-1">페르소나:</span>
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => setActivePersona(persona.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePersona === persona.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title={persona.name}
          >
            <span>{persona.emoji}</span>
            <span>{persona.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}