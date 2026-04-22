import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Keyword {
  word: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
}

export function KeywordAnalysis() {
  // Mock data - 실시간 키워드 TOP 10
  const keywords: Keyword[] = [
    { word: '잘한다', count: 87, sentiment: 'positive', trend: 'up' },
    { word: '멋지다', count: 64, sentiment: 'positive', trend: 'up' },
    { word: '화이팅', count: 52, sentiment: 'positive', trend: 'stable' },
    { word: 'ㅋㅋㅋ', count: 48, sentiment: 'positive', trend: 'up' },
    { word: '대단해', count: 41, sentiment: 'positive', trend: 'up' },
    { word: '재미있어', count: 38, sentiment: 'positive', trend: 'stable' },
    { word: '어려워', count: 15, sentiment: 'negative', trend: 'down' },
    { word: '힘들다', count: 12, sentiment: 'negative', trend: 'down' },
    { word: '지루해', count: 8, sentiment: 'negative', trend: 'stable' },
    { word: '못하네', count: 5, sentiment: 'negative', trend: 'down' },
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'negative':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-full">
      <div className="mb-4">
        <h3 className="text-white font-semibold text-lg mb-1">실시간 키워드</h3>
        <p className="text-sm text-slate-400">현재 반복 키워드 TOP 10</p>
      </div>

      <div className="space-y-2">
        {keywords.map((keyword, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${getSentimentColor(keyword.sentiment)}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 w-5">#{index + 1}</span>
              <span className="font-medium">{keyword.word}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {getTrendIcon(keyword.trend)}
                <span className="text-sm font-semibold">{keyword.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 통계 */}
      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">긍정 키워드</p>
          <p className="text-lg font-semibold text-blue-400">
            {keywords.filter(k => k.sentiment === 'positive').length}개
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">부정 키워드</p>
          <p className="text-lg font-semibold text-red-400">
            {keywords.filter(k => k.sentiment === 'negative').length}개
          </p>
        </div>
      </div>
    </div>
  );
}
