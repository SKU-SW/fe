import { MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  isHighlighted: boolean;
}

export function RecentChatFlow() {
  // Mock data
  const recentChats: ChatMessage[] = [
    { id: '1', user: 'user_123', message: '와 이번 플레이 진짜 멋있었어요!', time: '방금', sentiment: 'positive', isHighlighted: true },
    { id: '2', user: 'viewer_456', message: '잘한다 ㅋㅋㅋ', time: '1초 전', sentiment: 'positive', isHighlighted: true },
    { id: '3', user: 'fan_789', message: '이건 따라할 수가 없네', time: '2초 전', sentiment: 'positive', isHighlighted: false },
    { id: '4', user: 'gamer_abc', message: '화이팅!', time: '3초 전', sentiment: 'positive', isHighlighted: true },
    { id: '5', user: 'watcher_def', message: '오늘 컨디션 좋으신듯', time: '5초 전', sentiment: 'positive', isHighlighted: false },
    { id: '6', user: 'chat_ghi', message: '대단해요', time: '7초 전', sentiment: 'positive', isHighlighted: false },
    { id: '7', user: 'stream_jkl', message: '오 이거 어려운 거 아닌가요?', time: '9초 전', sentiment: 'neutral', isHighlighted: false },
    { id: '8', user: 'user_mno', message: 'ㄷㄷㄷ', time: '11초 전', sentiment: 'positive', isHighlighted: false },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-blue-400 bg-blue-500/5';
      case 'negative':
        return 'border-l-red-400 bg-red-500/5';
      default:
        return 'border-l-slate-600 bg-slate-900/30';
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          <h3 className="text-white font-semibold text-lg">실시간 채팅 흐름</h3>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400">긍정 우세</span>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        AI가 분석 중인 최근 채팅 • 하이라이트된 메시지가 판단 근거로 사용됨
      </p>

      {/* 채팅 목록 */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            className={`border-l-4 rounded-r-lg p-3 transition-all ${getSentimentColor(chat.sentiment)} ${
              chat.isHighlighted 
                ? 'ring-2 ring-yellow-500/30 bg-yellow-500/10' 
                : ''
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-400">{chat.user}</span>
                {chat.isHighlighted && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                    키워드 감지
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">{chat.time}</span>
            </div>
            <p className="text-sm text-slate-200">{chat.message}</p>
          </div>
        ))}
      </div>

      {/* 하단 통계 */}
      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">분석된 채팅</p>
          <p className="text-lg font-semibold text-white">198개</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">키워드 감지</p>
          <p className="text-lg font-semibold text-blue-400">23개</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">스팸 필터</p>
          <p className="text-lg font-semibold text-red-400">12개</p>
        </div>
      </div>
    </div>
  );
}
