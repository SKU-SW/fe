import { ThumbsUp, ThumbsDown, MessageSquare, Bot } from 'lucide-react';

interface MissedChat {
  id: string;
  user: string;
  message: string;
  time: string;
}

interface AIResponse {
  id: string;
  chatUser: string;
  chatMessage: string;
  aiResponse: string;
  time: string;
  feedback?: 'good' | 'bad';
}

export function MissedChatsPanel() {
  // Mock data
  const missedChats: MissedChat[] = [
    { id: '1', user: 'user_123', message: '스트리머님 저번에 말한 팁 궁금해요!', time: '2분 전' },
    { id: '2', user: 'gamer_456', message: '이 스킬 연계 어떻게 하는거예요?', time: '4분 전' },
    { id: '3', user: 'viewer_789', message: '방금 플레이 진짜 멋있었어요', time: '6분 전' },
    { id: '4', user: 'fan_abc', message: '다음 방송 언제 하시나요?', time: '8분 전' },
  ];

  const aiResponses: AIResponse[] = [
    {
      id: '1',
      chatUser: 'curious_user',
      chatMessage: '이 챔피언 카운터 뭐예요?',
      aiResponse: '제이스나 판테온 같은 초반 강한 챔피언들이 카운터입니다!',
      time: '1분 전',
      feedback: 'good',
    },
    {
      id: '2',
      chatUser: 'newbie_123',
      chatMessage: '빌드 순서 알려주세요',
      aiResponse: '보통 신화템 → 신발 → 2코어 순서로 가시면 됩니다',
      time: '3분 전',
    },
    {
      id: '3',
      chatUser: 'supporter',
      chatMessage: '방송 항상 잘 보고 있어요!',
      aiResponse: '감사합니다! 항상 응원해주셔서 힘이 됩니다 😊',
      time: '5분 전',
      feedback: 'good',
    },
  ];

  const handleFeedback = (responseId: string, feedback: 'good' | 'bad') => {
    console.log(`Feedback for ${responseId}: ${feedback}`);
    // 실제로는 학습 데이터로 저장
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4">놓친 채팅 & AI 대응 현황</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* 스트리머가 놓친 채팅 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-medium text-slate-300">놓친 채팅</h4>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {missedChats.length}개
            </span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {missedChats.map((chat) => (
              <div
                key={chat.id}
                className="bg-slate-900/50 border border-slate-600 rounded-lg p-3 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-400">{chat.user}</span>
                  <span className="text-xs text-slate-500">{chat.time}</span>
                </div>
                <p className="text-sm text-slate-300">{chat.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI가 대신 반응한 내역 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-slate-300">AI 대응</h4>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              {aiResponses.length}개
            </span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {aiResponses.map((response) => (
              <div
                key={response.id}
                className="bg-slate-900/50 border border-slate-600 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-400">{response.chatUser}</span>
                  <span className="text-xs text-slate-500">{response.time}</span>
                </div>
                
                {/* 원문 채팅 */}
                <div className="mb-2">
                  <p className="text-xs text-slate-400 mb-1">질문:</p>
                  <p className="text-sm text-slate-300">{response.chatMessage}</p>
                </div>
                
                {/* AI 응답 */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded p-2 mb-2">
                  <p className="text-xs text-blue-400 mb-1">AI 응답:</p>
                  <p className="text-sm text-slate-300">{response.aiResponse}</p>
                </div>
                
                {/* 피드백 버튼 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">이 응답이</span>
                  <button
                    onClick={() => handleFeedback(response.id, 'good')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      response.feedback === 'good'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    적절함
                  </button>
                  <button
                    onClick={() => handleFeedback(response.id, 'bad')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      response.feedback === 'bad'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    부적절함
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
