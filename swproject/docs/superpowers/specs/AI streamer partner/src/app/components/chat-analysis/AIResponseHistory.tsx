import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Volume2, ShieldOff, CheckCircle, Brain } from 'lucide-react';

interface ResponseHistoryItem {
  id: string;
  timestamp: string;
  response: string;
  mode: 'support' | 'criticism' | 'silence';
  detectedContext: {
    sentiment: string;
    keywords: string[];
    chatVolume: number;
  };
  status: 'outputted' | 'filtered';
  filterReason?: string;
}

export function AIResponseHistory() {
  const [expanded, setExpanded] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ResponseHistoryItem | null>(null);

  // Mock data
  const history: ResponseHistoryItem[] = [
    {
      id: '1',
      timestamp: '14:55:32',
      response: '오~ 지금 그 플레이 진짜 깔끔했는데요? 채팅에서도 다들 감탄하고 있어요!',
      mode: 'support',
      detectedContext: {
        sentiment: '긍정 73%',
        keywords: ['잘한다', '멋지다', '화이팅'],
        chatVolume: 198,
      },
      status: 'outputted',
    },
    {
      id: '2',
      timestamp: '14:52:18',
      response: '방금 그건 좀 실수였네요 ㅋㅋ 채팅도 다들 그러는데요?',
      mode: 'criticism',
      detectedContext: {
        sentiment: '부정 62%',
        keywords: ['아쉽다', '실수', '뭐야'],
        chatVolume: 156,
      },
      status: 'outputted',
    },
    {
      id: '3',
      timestamp: '14:48:45',
      response: '[필터링됨] 지금 [특정인물]처럼 하신 거 아니에요? ㅋㅋㅋ',
      mode: 'criticism',
      detectedContext: {
        sentiment: '부정 58%',
        keywords: ['특정인물', '비슷', '같다'],
        chatVolume: 142,
      },
      status: 'filtered',
      filterReason: '금지어 감지 (특정인물)',
    },
    {
      id: '4',
      timestamp: '14:45:21',
      response: '이번 판 정말 잘 풀리고 있네요! 이대로만 가시면 될 것 같아요!',
      mode: 'support',
      detectedContext: {
        sentiment: '긍정 75%',
        keywords: ['좋다', '완벽', '대박'],
        chatVolume: 203,
      },
      status: 'outputted',
    },
    {
      id: '5',
      timestamp: '14:42:03',
      response: '음.. 채팅이 좀 과열되는 것 같네요. 다음 플레이에 집중해볼까요?',
      mode: 'support',
      detectedContext: {
        sentiment: '부정 54%',
        keywords: ['논쟁', '말이야', '아니지'],
        chatVolume: 287,
      },
      status: 'outputted',
    },
    {
      id: '6',
      timestamp: '14:38:17',
      response: '[필터링됨] [욕설] 진짜 답답하시네요 ㅋㅋㅋ',
      mode: 'criticism',
      detectedContext: {
        sentiment: '부정 68%',
        keywords: ['답답', '왜', '그냥'],
        chatVolume: 178,
      },
      status: 'filtered',
      filterReason: '비속어 감지',
    },
  ];

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'support':
        return 'blue';
      case 'criticism':
        return 'red';
      case 'silence':
        return 'slate';
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'support':
        return '응원';
      case 'criticism':
        return '비판';
      case 'silence':
        return '침묵';
    }
  };

  const stats = {
    total: history.length,
    outputted: history.filter(h => h.status === 'outputted').length,
    filtered: history.filter(h => h.status === 'filtered').length,
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-white font-semibold text-lg">AI 반응 이력</h3>
              <p className="text-sm text-slate-400">AI가 실제로 출력한 반응과 판단 근거</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 통계 요약 */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-slate-400">출력</span>
                <span className="text-white font-semibold">{stats.outputted}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldOff className="w-4 h-4 text-red-400" />
                <span className="text-slate-400">차단</span>
                <span className="text-white font-semibold">{stats.filtered}</span>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 이력 목록 */}
      {expanded && (
        <div className="p-6">
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  item.status === 'filtered'
                    ? 'bg-slate-900/30 border-slate-700/50 opacity-60'
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">{item.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${getModeColor(item.mode)}-500/20 text-${getModeColor(item.mode)}-400`}>
                      {getModeLabel(item.mode)} 모드
                    </span>
                    {item.status === 'filtered' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
                        <ShieldOff className="w-3 h-3" />
                        안전 필터 차단
                      </span>
                    )}
                    {item.status === 'outputted' && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        TTS 출력됨
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {selectedItem?.id === item.id ? '접기' : '근거 보기'}
                  </button>
                </div>

                {/* 응답 내용 */}
                <div className={`mb-3 ${item.status === 'filtered' ? 'line-through' : ''}`}>
                  <p className={`text-sm ${
                    item.status === 'filtered' ? 'text-slate-500' : 'text-white'
                  } leading-relaxed`}>
                    {item.response}
                  </p>
                  {item.filterReason && (
                    <p className="text-xs text-red-400 mt-1">차단 사유: {item.filterReason}</p>
                  )}
                </div>

                {/* 판단 근거 (펼쳐진 경우) */}
                {selectedItem?.id === item.id && (
                  <div className="pt-3 border-t border-slate-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-400 mb-2">AI 판단 근거</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-800 rounded p-2">
                            <p className="text-slate-400 mb-1">감지된 여론</p>
                            <p className="text-white font-medium">{item.detectedContext.sentiment}</p>
                          </div>
                          <div className="bg-slate-800 rounded p-2">
                            <p className="text-slate-400 mb-1">채팅 속도</p>
                            <p className="text-white font-medium">{item.detectedContext.chatVolume}개/분</p>
                          </div>
                          <div className="bg-slate-800 rounded p-2">
                            <p className="text-slate-400 mb-1">주요 키워드</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.detectedContext.keywords.map((keyword, idx) => (
                                <span key={idx} className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                  #{keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
