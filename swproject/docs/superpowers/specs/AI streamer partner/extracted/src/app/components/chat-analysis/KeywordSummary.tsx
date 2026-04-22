import { Hash, TrendingUp } from 'lucide-react';

interface KeywordData {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative';
  percentage: number;
}

export function KeywordSummary() {
  // Mock data
  const topKeywords: KeywordData[] = [
    { word: '잘한다', count: 87, sentiment: 'positive', percentage: 18 },
    { word: '멋지다', count: 64, sentiment: 'positive', percentage: 13 },
    { word: '화이팅', count: 52, sentiment: 'positive', percentage: 11 },
    { word: 'ㅋㅋㅋ', count: 48, sentiment: 'positive', percentage: 10 },
    { word: '대단해', count: 41, sentiment: 'positive', percentage: 9 },
  ];

  const stats = {
    totalKeywords: 487,
    positiveRatio: 73,
    topKeywordImpact: 18,
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-slate-400" />
        <h3 className="text-white font-semibold text-lg">키워드 요약</h3>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        AI 판단에 가장 큰 영향을 준 키워드
      </p>

      {/* TOP 5 키워드 */}
      <div className="space-y-3 mb-6">
        {topKeywords.map((keyword, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 w-4">#{idx + 1}</span>
                <span className={`font-medium ${
                  keyword.sentiment === 'positive' ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {keyword.word}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{keyword.count}</span>
                <span className="text-xs text-slate-500">{keyword.percentage}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  keyword.sentiment === 'positive' ? 'bg-blue-500' : 'bg-red-500'
                }`}
                style={{ width: `${keyword.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 키워드 통계 */}
      <div className="pt-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">전체 키워드 수</span>
          <span className="text-white font-semibold">{stats.totalKeywords}개</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">긍정 비율</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${stats.positiveRatio}%` }}
              />
            </div>
            <span className="text-blue-400 font-semibold">{stats.positiveRatio}%</span>
          </div>
        </div>
      </div>

      {/* AI 인사이트 */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-400 mb-1">AI 인사이트</p>
            <p className="text-xs text-slate-300">
              '잘한다', '멋지다' 키워드가 급증하며 응원 모드 전환을 트리거했습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
