import { Brain, TrendingUp, MessageSquare, ArrowRight, Volume2, CheckCircle, AlertCircle } from 'lucide-react';

export function AIDecisionPipeline() {
  // Mock data - AI 의사결정 데이터
  const detectionData = {
    sentiment: {
      positive: 73,
      negative: 27,
      trend: 'increasing', // increasing, decreasing, stable
    },
    keywords: [
      { word: '잘한다', count: 87, sentiment: 'positive' },
      { word: '멋지다', count: 64, sentiment: 'positive' },
      { word: '화이팅', count: 52, sentiment: 'positive' },
    ],
    chatVolume: 198,
    recentTone: '긍정적',
  };

  const decisionData = {
    strategy: 'support', // support, criticism, silence
    confidence: 92,
    reasoning: [
      '긍정 키워드가 70% 이상 우세',
      '채팅 속도가 평소보다 30% 증가',
      '스트리머 플레이 성공 직후 반응',
    ],
    nextActionIn: 8, // 초
  };

  const outputData = {
    nextMent: '오~ 지금 그 플레이 진짜 깔끔했는데요? 채팅에서도 다들 감탄하고 있어요!',
    mentType: 'proactive', // proactive, reactive
    targetEmotion: '응원/격려',
    alternatives: [
      '와 방금 그거 어떻게 한 거예요? 채팅이 난리났는데요!',
      '이 정도면 프로 수준이신데요? 다들 놀라고 있어요!',
    ],
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
      <div className="flex items-center gap-3 mb-8">
        <Brain className="w-6 h-6 text-blue-400" />
        <h3 className="text-white font-semibold text-xl">AI 판단 파이프라인</h3>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full ml-auto">
          실시간 분석 중
        </span>
      </div>

      {/* 3단계 파이프라인: 감지 → 판단 → 출력 */}
      <div className="grid grid-cols-7 gap-4 items-start">
        
        {/* 1단계: 감지 (Detection) */}
        <div className="col-span-2 bg-slate-900/50 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">1. 감지</h4>
              <p className="text-xs text-slate-400">Detection</p>
            </div>
          </div>

          {/* 감정 분석 */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">채팅 여론</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-full"
                  style={{ width: `${detectionData.sentiment.positive}%` }}
                />
                <div 
                  className="bg-red-500 h-full"
                  style={{ width: `${detectionData.sentiment.negative}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-400">{detectionData.sentiment.positive}%</span>
              <span className="text-red-400">{detectionData.sentiment.negative}%</span>
            </div>
          </div>

          {/* 주요 키워드 */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">주요 키워드</p>
            <div className="space-y-1">
              {detectionData.keywords.slice(0, 3).map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-blue-400">#{kw.word}</span>
                  <span className="text-slate-500">{kw.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 현재 톤 */}
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">현재 톤</span>
              <span className="text-sm font-semibold text-blue-400">{detectionData.recentTone}</span>
            </div>
          </div>
        </div>

        {/* 화살표 */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-slate-600" />
        </div>

        {/* 2단계: 판단 (Decision) */}
        <div className="col-span-2 bg-slate-900/50 border border-purple-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">2. 판단</h4>
              <p className="text-xs text-slate-400">Decision</p>
            </div>
          </div>

          {/* 선택된 전략 */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">반응 전략</p>
            <div className={`px-3 py-2 rounded-lg font-medium text-sm ${
              decisionData.strategy === 'support' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : decisionData.strategy === 'criticism'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}>
              {decisionData.strategy === 'support' ? '응원 모드' : 
               decisionData.strategy === 'criticism' ? '비판 편승' : '침묵'}
            </div>
          </div>

          {/* 확신도 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">확신도</span>
              <span className="text-xs font-semibold text-green-400">{decisionData.confidence}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${decisionData.confidence}%` }}
              />
            </div>
          </div>

          {/* 판단 근거 */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2">판단 근거</p>
            <div className="space-y-1.5">
              {decisionData.reasoning.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-slate-300">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 다음 행동 카운트다운 */}
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">다음 반응까지</span>
              <span className="text-sm font-semibold text-purple-400">{decisionData.nextActionIn}초</span>
            </div>
          </div>
        </div>

        {/* 화살표 */}
        <div className="flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-slate-600" />
        </div>

        {/* 3단계: 출력 (Output) */}
        <div className="col-span-2 bg-slate-900/50 border border-green-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">3. 출력</h4>
              <p className="text-xs text-slate-400">Output</p>
            </div>
          </div>

          {/* 다음 멘트 미리보기 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">다음 멘트</p>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                {outputData.mentType === 'proactive' ? '선제 반응' : '채팅 반응'}
              </span>
            </div>
            <div className="bg-slate-800 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-white leading-relaxed">{outputData.nextMent}</p>
            </div>
          </div>

          {/* 목표 감정 */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">목표 감정</span>
              <span className="text-xs font-medium text-green-400">{outputData.targetEmotion}</span>
            </div>
          </div>

          {/* 대안 멘트 */}
          <div>
            <p className="text-xs text-slate-400 mb-2">대안 멘트 (2개)</p>
            <div className="space-y-2">
              {outputData.alternatives.slice(0, 2).map((alt, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-800/50 rounded px-2 py-1.5 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {alt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 파이프라인 상태 표시 */}
      <div className="mt-6 pt-6 border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">파이프라인 정상 작동</span>
          </div>
          <div className="text-sm text-slate-500">
            평균 처리 시간: <span className="text-slate-300 font-medium">12ms</span>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm text-white">
          <AlertCircle className="w-4 h-4" />
          <span>AI 판단 수동 개입</span>
        </button>
      </div>
    </div>
  );
}
