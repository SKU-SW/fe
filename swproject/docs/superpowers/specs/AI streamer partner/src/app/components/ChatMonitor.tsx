import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function ChatMonitor() {
  const chatSentiment = 'positive'; // 'positive' | 'negative' | 'neutral'
  
  const recentChats = [
    { id: 1, user: '시청자123', message: '오늘 플레이 좋은데요?', sentiment: 'positive' },
    { id: 2, user: 'viewer456', message: '방금 그거 뭐예요??', sentiment: 'neutral' },
    { id: 3, user: '팬789', message: '킬 잘했어요 ㅋㅋㅋ', sentiment: 'positive' },
    { id: 4, user: 'user999', message: 'AI 반응 재밌네요', sentiment: 'positive' },
    { id: 5, user: 'watcher111', message: '저도 하고 싶다', sentiment: 'neutral' },
  ];

  const sentimentIcon = {
    positive: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    negative: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
    neutral: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  };

  const current = sentimentIcon[chatSentiment];
  const SentimentIcon = current.icon;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">채팅 모니터</h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${current.bg}`}>
          <SentimentIcon className={`w-4 h-4 ${current.color}`} />
          <span className={`text-xs ${current.color}`}>
            {chatSentiment === 'positive' ? '긍정적' : chatSentiment === 'negative' ? '부정적' : '중립'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-400 mb-1">{chat.user}</p>
                <p className="text-sm text-slate-200 break-words">{chat.message}</p>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                chat.sentiment === 'positive' ? 'bg-green-400' :
                chat.sentiment === 'negative' ? 'bg-red-400' : 'bg-slate-400'
              }`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-600">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-green-400 font-semibold">73%</div>
            <div className="text-slate-400">긍정</div>
          </div>
          <div>
            <div className="text-slate-400 font-semibold">22%</div>
            <div className="text-slate-400">중립</div>
          </div>
          <div>
            <div className="text-red-400 font-semibold">5%</div>
            <div className="text-slate-400">부정</div>
          </div>
        </div>
      </div>
    </div>
  );
}
