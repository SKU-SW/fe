import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Plus, Settings } from 'lucide-react';

interface ExceptionRule {
  id: string;
  condition: string;
  action: string;
}

export function AIResponseRangeSection() {
  const [expanded, setExpanded] = useState(true);
  const [criticismAllowed, setCriticismAllowed] = useState(true);
  const [intensityLevel, setIntensityLevel] = useState(35); // 0-100
  const [showAddRule, setShowAddRule] = useState(false);
  const [exceptionRules, setExceptionRules] = useState<ExceptionRule[]>([
    { id: '1', condition: '게임 클리어 성공 시', action: '비판 편승 금지' },
    { id: '2', condition: '도네이션 직후 30초', action: '비판 편승 금지' },
  ]);

  const getIntensityLabel = (value: number) => {
    if (value >= 75) return '강한 비판';
    if (value >= 50) return '적극적 비판';
    if (value >= 25) return '가벼운 놀림';
    return '매우 약한 놀림';
  };

  const getIntensityDescription = (value: number) => {
    if (value >= 75) return 'AI가 적극적으로 비판에 동조하며 강한 표현 사용';
    if (value >= 50) return 'AI가 비판을 인정하며 적극적으로 반응';
    if (value >= 25) return 'AI가 가볍게 놀리는 수준의 반응';
    return 'AI가 매우 약하게 장난스럽게만 반응';
  };

  const handleAddRule = () => {
    setShowAddRule(true);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="text-white font-semibold text-lg">AI 반응 허용 범위 설정</h3>
              <p className="text-sm text-slate-400">AI가 비판적 채팅에 어떻게 반응할지 설정하세요</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 섹션 내용 */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* 비판 편승 허용 여부 */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-600 rounded-xl">
            <div>
              <p className="text-white font-medium text-lg">비판 편승 허용</p>
              <p className="text-sm text-slate-400 mt-1">채팅이 비판적일 때 AI도 동조할 수 있도록 허용</p>
            </div>
            <button
              onClick={() => setCriticismAllowed(!criticismAllowed)}
              className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
                criticismAllowed ? 'bg-orange-500' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  criticismAllowed ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 허용 표현 강도 슬라이더 */}
          {criticismAllowed && (
            <div>
              <h4 className="text-white font-medium mb-3">허용 표현 강도</h4>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">현재 설정</span>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-orange-400">
                      {getIntensityLabel(intensityLevel)}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getIntensityDescription(intensityLevel)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <span className="text-xs text-slate-500 whitespace-nowrap">가벼운 놀림</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={intensityLevel}
                      onChange={(e) => setIntensityLevel(Number(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-lg appearance-none cursor-pointer slider-intensity"
                    />
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">강한 비판</span>
                </div>

                {/* 강도별 예시 */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">응답 예시</p>
                  <div className="bg-slate-800 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {intensityLevel >= 75 && '"아 진짜 이건 좀 심했네요 ㅋㅋㅋ 채팅 말이 맞는 것 같은데요?"'}
                      {intensityLevel >= 50 && intensityLevel < 75 && '"에이 방금 건 좀 아쉬웠죠? 채팅에서도 다들 그러네요 ㅋㅋ"'}
                      {intensityLevel >= 25 && intensityLevel < 50 && '"어머 방금 그건 좀... 뭐 실수는 할 수 있죠~ 채팅도 웃고 있네요"'}
                      {intensityLevel < 25 && '"앗 방금 건 좀 아쉽긴 했네요~ 하지만 다음엔 잘하실 거예요!"'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 상황별 예외 규칙 */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">상황별 예외 규칙</h4>
              <button
                onClick={handleAddRule}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                규칙 추가
              </button>
            </div>

            <div className="space-y-2">
              {exceptionRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-orange-400" />
                    <div>
                      <p className="text-sm text-white font-medium">{rule.condition}</p>
                      <p className="text-xs text-slate-400 mt-0.5">→ {rule.action}</p>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-red-400 transition-colors text-sm">
                    삭제
                  </button>
                </div>
              ))}
            </div>

            {showAddRule && (
              <div className="mt-3 p-4 bg-slate-900/50 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-slate-400 mb-3">새 예외 규칙 추가</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="조건 (예: 게임 클리어 시)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="동작 (예: 비판 편승 금지)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded text-sm text-white transition-colors">
                      추가
                    </button>
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .slider-intensity::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .slider-intensity::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
