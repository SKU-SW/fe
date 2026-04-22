import { useState } from 'react';
import { Brain, Volume2, AlertCircle, Play, Pause } from 'lucide-react';

type AIMode = 'support' | 'criticism' | 'silence';

export function AIJudgementPanel() {
  const [currentMode, setCurrentMode] = useState<AIMode>('support');
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [cooldownTimer, setCooldownTimer] = useState(8);

  // Mock data
  const sentimentScore = 73; // 긍정: 73, 부정: 27
  const modeThresholds = {
    supportMin: 60, // 긍정이 60% 이상이면 응원 모드
    criticismMax: 40, // 긍정이 40% 이하면 비판 편승
  };

  const nextMent = {
    text: '오~ 지금 그 플레이 진짜 깔끔했는데요? 채팅에서도 다들 감탄하고 있어요!',
    confidence: 92,
    targetEmotion: '응원/격려',
  };

  const handleModeOverride = (mode: AIMode) => {
    setCurrentMode(mode);
    setIsAutoMode(false);
  };

  const handleResetToAuto = () => {
    setIsAutoMode(true);
  };

  const getModeColor = (mode: AIMode) => {
    switch (mode) {
      case 'support':
        return 'blue';
      case 'criticism':
        return 'red';
      case 'silence':
        return 'slate';
    }
  };

  const getModeLabel = (mode: AIMode) => {
    switch (mode) {
      case 'support':
        return '응원 모드';
      case 'criticism':
        return '비판 편승';
      case 'silence':
        return '침묵';
    }
  };

  const getModeIcon = (mode: AIMode) => {
    switch (mode) {
      case 'support':
        return '💪';
      case 'criticism':
        return '🤔';
      case 'silence':
        return '🤫';
    }
  };

  return (
    <div className="bg-slate-800 border-2 border-blue-500/50 rounded-xl p-8 shadow-lg shadow-blue-500/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-7 h-7 text-blue-400" />
          <div>
            <h3 className="text-white font-semibold text-2xl">LLM 판단 현황</h3>
            <p className="text-xs text-slate-400">채팅 흐름을 분석하여 반응 결정</p>
          </div>
        </div>
        {!isAutoMode && (
          <button
            onClick={handleResetToAuto}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            자동 모드로 복귀
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* 1단계: 감지 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
              1
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg">감지</h4>
              <p className="text-xs text-slate-400">Detection</p>
            </div>
          </div>

          {/* 여론 게이지 */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-3">현재 여론 방향</p>
            
            {/* 게이지 바 */}
            <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden">
              <div className="absolute inset-0 flex">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${sentimentScore}%` }}
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-300"
                  style={{ width: `${100 - sentimentScore}%` }}
                />
              </div>
              
              {/* 임계값 선 - 응원 모드 */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                style={{ left: `${modeThresholds.supportMin}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs text-white whitespace-nowrap bg-slate-800 px-1 rounded">
                  응원
                </div>
              </div>
              
              {/* 임계값 선 - 비판 모드 */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                style={{ left: `${modeThresholds.criticismMax}%` }}
              >
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white whitespace-nowrap bg-slate-800 px-1 rounded">
                  비판
                </div>
              </div>
            </div>

            {/* 점수 표시 */}
            <div className="flex justify-between mt-3">
              <div className="text-center">
                <p className="text-xs text-slate-500">긍정</p>
                <p className="text-xl font-bold text-blue-400">{sentimentScore}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">부정</p>
                <p className="text-xl font-bold text-red-400">{100 - sentimentScore}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2단계: 판단 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">
              2
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg">판단</h4>
              <p className="text-xs text-slate-400">Decision</p>
            </div>
          </div>

          {/* 선택된 전략 */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-3">현재 반응 전략</p>
            
            <div className={`px-5 py-4 rounded-lg border-2 bg-${getModeColor(currentMode)}-500/20 border-${getModeColor(currentMode)}-500/50 text-center mb-4`}>
              <div className="text-3xl mb-2">{getModeIcon(currentMode)}</div>
              <p className={`text-xl font-bold text-${getModeColor(currentMode)}-400`}>
                {getModeLabel(currentMode)}
              </p>
            </div>

            {isAutoMode ? (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-2 rounded justify-center">
                <Play className="w-3 h-3" />
                자동 모드 (AI 판단)
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 px-3 py-2 rounded justify-center">
                <Pause className="w-3 h-3" />
                수동 오버라이드
              </div>
            )}
          </div>

          {/* 수동 오버라이드 버튼 */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">수동 모드 전환</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleModeOverride('support')}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  currentMode === 'support' && !isAutoMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                응원
              </button>
              <button
                onClick={() => handleModeOverride('criticism')}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  currentMode === 'criticism' && !isAutoMode
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                비판
              </button>
              <button
                onClick={() => handleModeOverride('silence')}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  currentMode === 'silence' && !isAutoMode
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                침묵
              </button>
            </div>
          </div>
        </div>

        {/* 3단계: 출력 예정 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center font-bold text-green-400">
              3
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg">출력 예정</h4>
              <p className="text-xs text-slate-400">Output</p>
            </div>
          </div>

          {/* 다음 멘트 미리보기 */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">다음 멘트</p>
              <div className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">TTS 준비됨</span>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-3">
              <p className="text-sm text-white leading-relaxed">
                "{nextMent.text}"
              </p>
            </div>

            {/* 메타 정보 */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">목표 감정</span>
                <span className="text-green-400 font-medium">{nextMent.targetEmotion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">확신도</span>
                <span className="text-green-400 font-medium">{nextMent.confidence}%</span>
              </div>
            </div>
          </div>

          {/* 반응 쿨다운 타이머 */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">다음 반응까지</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-green-400 flex items-center justify-center">
                  <span className="text-lg font-bold text-green-400">{cooldownTimer}</span>
                </div>
                <span className="text-xs text-slate-500">초</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}