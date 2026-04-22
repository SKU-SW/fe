import { Hash, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Keyword {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative';
  trend: 'up' | 'down' | 'stable';
  trendValue: number; // 최근 30초 증가량
}

export function RealtimeKeywordPanel() {
  // Mock data
  const keywords: Keyword[] = [
    { word: '잘한다', count: 87, sentiment: 'positive', trend: 'up', trendValue: 12 },
    { word: '멋지다', count: 64, sentiment: 'positive', trend: 'up', trendValue: 8 },
    { word: '화이팅', count: 52, sentiment: 'positive', trend: 'stable', trendValue: 0 },
    { word: 'ㅋㅋㅋ', count: 48, sentiment: 'positive', trend: 'up', trendValue: 5 },
    { word: '대단해', count: 41, sentiment: 'positive', trend: 'up', trendValue: 7 },
    { word: '오', count: 38, sentiment: 'positive', trend: 'down', trendValue: -3 },
    { word: '완벽', count: 35, sentiment: 'positive', trend: 'stable', trendValue: 0 },
    { word: '좋다', count: 29, sentiment: 'positive', trend: 'up', trendValue: 4 },
    { word: '프로', count: 24, sentiment: 'positive', trend: 'up', trendValue: 6 },
    { word: '감탄', count: 19, sentiment: 'positive', trend: 'stable', trendValue: 0 },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-slate-500" />;
    }
  };

  const getTrendText = (trend: string, value: number) => {
    if (trend === 'stable') return '';
    return value > 0 ? `+${value}` : `${value}`;
  };

  const getSentimentColor = (sentiment: string) => {
    return sentiment === 'positive' ? 'blue' : 'red';
  };

  const maxCount = Math.max(...keywords.map(k => k.count));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold text-lg">실시간 키워드</h3>
        </div>
        <div className="text-xs text-slate-400">
          TOP 10 • 30초 단위 갱신
        </div>
      </div>

      {/* 키워드 목록 */}
      <div className="space-y-3">
        {keywords.map((keyword, idx) => {
          const color = getSentimentColor(keyword.sentiment);
          const percentage = (keyword.count / maxCount) * 100;
          
          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-6 text-${color}-400`}>
                    #{idx + 1}
                  </span>
                  <span className={`font-medium text-${color}-400`}>
                    {keyword.word}
                  </span>
                  {getTrendIcon(keyword.trend)}
                </div>
                <div className="flex items-center gap-2">
                  {keyword.trend !== 'stable' && (
                    <span className={`text-xs ${
                      keyword.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {getTrendText(keyword.trend, keyword.trendValue)}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-white w-12 text-right">
                    {keyword.count}
                  </span>
                </div>
              </div>

              {/* 진행 바 */}
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-${color}-500 transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
                
                {/* 호버 시 정��한 값 표시 */}
                <div className="absolute inset-0 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white font-medium">
                    {Math.round(percentage)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 통계 */}
      <div className="mt-6 pt-4 border-t border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">감지된 키워드</span>
          <span className="text-white font-semibold">
            {keywords.reduce((sum, k) => sum + k.count, 0)}개
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">긍정 비율</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ 
                  width: `${(keywords.filter(k => k.sentiment === 'positive').length / keywords.length) * 100}%` 
                }}
              />
            </div>
            <span className="text-blue-400 font-semibold">
              {Math.round((keywords.filter(k => k.sentiment === 'positive').length / keywords.length) * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">상승 추세</span>
          <span className="text-green-400 font-semibold">
            {keywords.filter(k => k.trend === 'up').length}개
          </span>
        </div>
      </div>
    </div>
  );
}
