import { Clock } from "lucide-react";

export function AIActivityLog() {
  const activities = [
    { id: 1, time: '14:32:15', type: 'response', content: '"와 방금 플레이 진짜 대박이었어요!"' },
    { id: 2, time: '14:31:42', type: 'chat', content: '시청자 질문에 반응: "저도 궁금했어요"' },
    { id: 3, time: '14:30:28', type: 'auto', content: '무음 구간 감지 - 자동 멘트 출력' },
    { id: 4, time: '14:29:55', type: 'response', content: '"그건 좀 어려운데요? ㅋㅋ"' },
    { id: 5, time: '14:28:12', type: 'game', content: '게임 이벤트 반응: 킬 달성' },
  ];

  const typeLabels: Record<string, { label: string; color: string }> = {
    response: { label: '대화', color: 'bg-blue-500' },
    chat: { label: '채팅', color: 'bg-green-500' },
    auto: { label: '자동', color: 'bg-purple-500' },
    game: { label: '게임', color: 'bg-orange-500' },
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">AI 활동 로그</h3>
        <button className="text-xs text-blue-400 hover:text-blue-300">전체보기</button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {activities.map((activity) => {
          const typeInfo = typeLabels[activity.type];
          return (
            <div
              key={activity.id}
              className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/70 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs text-white ${typeInfo.color} flex-shrink-0`}>
                  {typeInfo.label}
                </div>
              </div>
              <p className="text-sm text-slate-200 mt-2 ml-0">{activity.content}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-600">
        <div className="text-xs text-slate-400 text-center">
          오늘 총 <span className="text-blue-400 font-semibold">247</span>회 반응
        </div>
      </div>
    </div>
  );
}
