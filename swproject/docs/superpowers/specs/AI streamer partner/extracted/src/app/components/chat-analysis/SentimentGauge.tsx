import { useState } from "react";
import { AlertCircle, TrendingUp, RotateCcw } from "lucide-react";
import { Progress } from "../ui/progress";

export function SentimentGauge() {
  const [currentMode, setCurrentMode] = useState<'support' | 'criticism'>('support');
  const [isOverridden, setIsOverridden] = useState(false);
  
  // Mock data
  const sentimentData = {
    positive: 73,
    negative: 27,
    threshold: 60, // 부정 60% 초과 시 모드 전환
    cooldownRemaining: 45, // 초
    cooldownTotal: 60,
  };

  const handleModeOverride = (mode: 'support' | 'criticism') => {
    setCurrentMode(mode);
    setIsOverridden(true);
  };

  const resetOverride = () => {
    setIsOverridden(false);
    // AI 자동 감지 모드로 복귀
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-lg mb-1">여론 감지 현황</h3>
          <p className="text-sm text-slate-400">실시간 채팅 감정 분석 및 AI 반응 모드</p>
        </div>
        
        {/* 현재 AI 반응 모드 배지 */}
        <div className="flex items-center gap-3">
          {isOverridden && (
            <button
              onClick={resetOverride}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              자동 모드
            </button>
          )}
          <div className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            currentMode === 'support' 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span>{currentMode === 'support' ? '응원 모드' : '비판 편승 모드'}</span>
          </div>
        </div>
      </div>

      {/* 대형 게이지 바 */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-400">긍정 {sentimentData.positive}%</span>
          <span className="text-sm font-medium text-red-400">부정 {sentimentData.negative}%</span>
        </div>
        
        {/* 게이지 바 */}
        <div className="relative h-12 bg-slate-900 rounded-lg overflow-hidden border border-slate-600">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
            style={{ width: `${sentimentData.positive}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-600 to-red-500 transition-all duration-500"
            style={{ width: `${sentimentData.negative}%` }}
          />
          
          {/* 모드 전환 임계값 선 */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
            style={{ left: `${100 - sentimentData.threshold}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs text-yellow-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                전환 기준
              </span>
            </div>
          </div>

          {/* 중앙 값 표시 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-900/90 px-3 py-1 rounded-full border border-slate-600">
              <span className="text-sm font-semibold text-white">
                {sentimentData.positive > sentimentData.negative ? '긍정 우세' : '부정 우세'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 모드 수동 오버라이드 + 쿨다운 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">수동 전환:</span>
          <button
            onClick={() => handleModeOverride('support')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentMode === 'support' && isOverridden
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            응원 모드
          </button>
          <button
            onClick={() => handleModeOverride('criticism')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentMode === 'criticism' && isOverridden
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            비판 편승
          </button>
        </div>

        {/* 쿨다운 표시 */}
        <div className="flex-1 max-w-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">반응 쿨다운</span>
            <span className="text-xs text-blue-400 font-medium">
              {sentimentData.cooldownRemaining}초 남음
            </span>
          </div>
          <Progress 
            value={(sentimentData.cooldownRemaining / sentimentData.cooldownTotal) * 100} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
}
