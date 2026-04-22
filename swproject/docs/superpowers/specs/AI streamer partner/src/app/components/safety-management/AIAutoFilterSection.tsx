import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface AIAutoFilterSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

interface FilterCategory {
  id: string;
  label: string;
  description: string;
  sensitivity: number;
}

export function AIAutoFilterSection({ enabled, onToggle }: AIAutoFilterSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [autoReplacement, setAutoReplacement] = useState(true);
  const [categories, setCategories] = useState<FilterCategory[]>([
    { id: 'hate', label: '혐오 표현', description: '특정 집단에 대한 혐오 발언', sensitivity: 80 },
    { id: 'criticism', label: '과도한 비판', description: '스트리머를 과도하게 비난하는 표현', sensitivity: 60 },
    { id: 'privacy', label: '개인정보 노출', description: '개인정보 또는 민감정보 포함', sensitivity: 90 },
    { id: 'explicit', label: '음란성 표현', description: '선정적이거나 부적절한 내용', sensitivity: 85 },
  ]);

  const handleSensitivityChange = (id: string, value: number) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, sensitivity: value } : cat
    ));
  };

  const getSensitivityLabel = (value: number) => {
    if (value >= 80) return '매�� 엄격';
    if (value >= 60) return '엄격';
    if (value >= 40) return '보통';
    if (value >= 20) return '관대';
    return '매우 관대';
  };

  const exampleReplacement = autoReplacement 
    ? "음, 방금 채팅에 부적절한 내용이 있어서 넘어갈게요. 대신 게임에 집중해볼까요?"
    : null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-white font-semibold text-lg">LLM 기반 유해성 판단</h3>
              <p className="text-sm text-slate-400">AI가 부적절한 내용을 자동으로 감지하고 차단합니다</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* 메인 토글 - 크게 */}
        <div className="mt-6 flex items-center justify-between p-4 bg-slate-900/50 border border-slate-600 rounded-xl">
          <div>
            <p className="text-white font-medium text-lg">AI 필터링 활성화</p>
            <p className="text-sm text-slate-400 mt-1">모든 채팅과 AI 응답에 자동 필터 적용</p>
          </div>
          <button
            onClick={() => onToggle(!enabled)}
            className={`relative w-20 h-10 rounded-full transition-colors duration-200 ${
              enabled ? 'bg-green-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-8 h-8 bg-white rounded-full transition-transform duration-200 ${
                enabled ? 'translate-x-10' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 섹션 내용 */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* 차단 카테고리 */}
          <div>
            <h4 className="text-white font-medium mb-4">차단 카테고리</h4>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={true}
                        className="mt-1 w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900"
                        readOnly
                      />
                      <div>
                        <p className="text-white font-medium">{category.label}</p>
                        <p className="text-sm text-slate-400">{category.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* 민감도 슬라이더 */}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">민감도</span>
                      <span className="text-xs font-medium text-blue-400">
                        {getSensitivityLabel(category.sensitivity)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">관대</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={category.sensitivity}
                        onChange={(e) => handleSensitivityChange(category.id, Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-xs text-slate-500">엄격</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 대체 응답 자동 생성 */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-white font-medium">차단 시 대체 응답 자동 생성</h4>
                <p className="text-sm text-slate-400 mt-1">필터링된 채팅에 대해 AI가 자연스럽게 넘어가는 멘트 생성</p>
              </div>
              <button
                onClick={() => setAutoReplacement(!autoReplacement)}
                className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
                  autoReplacement ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                    autoReplacement ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 대체 응답 예시 미리보기 */}
            {autoReplacement && exampleReplacement && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
                  <span className="text-xs font-medium text-blue-400">대체 응답 예시</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">"{exampleReplacement}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}