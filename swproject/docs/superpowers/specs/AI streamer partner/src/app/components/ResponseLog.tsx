import { useState } from 'react';
import { Search, Download, Clock, MessageSquare, Mic2, Shield, Zap } from 'lucide-react';

type LogType = 'all' | 'chat' | 'call' | 'blocked' | 'auto';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'chat' | 'call' | 'blocked' | 'auto';
  trigger: string;
  response: string;
  user?: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '15:23:41',
    type: 'call',
    trigger: '야 AI야, 지금 상대팀 정글 어디야?',
    response: '아 잠깐만, 미니맵 보니까 상대 정글이 방금 우리 와드 밟았어. 탑 쪽으로 가는 것 같은데? 조심해!',
    user: '스트리머',
  },
  {
    id: '2',
    timestamp: '15:22:15',
    type: 'chat',
    trigger: '오늘 방송 분위기 좋다 ㅋㅋㅋ',
    response: '그치? 오늘 채팅 텐션 진짜 좋아! 여러분 덕분에 나도 신나네 ㅎㅎ',
    user: 'user123',
  },
  {
    id: '3',
    timestamp: '15:20:33',
    type: 'auto',
    trigger: '[자동 반응] 시청자 100명 돌파',
    response: '오! 벌써 100명이나 들어왔네? 다들 환영해요~ 오늘도 재미있게 놀아봅시다!',
  },
  {
    id: '4',
    timestamp: '15:18:47',
    type: 'blocked',
    trigger: '[부적절한 내용으로 차단됨]',
    response: '',
    user: 'blocked_user',
  },
  {
    id: '5',
    timestamp: '15:17:22',
    type: 'chat',
    trigger: '이번 패치 어때? 메타 바뀐 거 같은데',
    response: '음.. 확실히 탱커 메타가 강해진 것 같아. 근데 우리 주인님 픽은 아직 괜찮은 편이니까 걱정 마!',
    user: 'gamer99',
  },
  {
    id: '6',
    timestamp: '15:15:01',
    type: 'call',
    trigger: 'AI야, 지금 백 타이밍이야?',
    response: '응응, 지금 백 가는 게 좋을 것 같아. 돈도 모였고 웨이브도 밀렸으니까!',
    user: '스트리머',
  },
  {
    id: '7',
    timestamp: '15:12:44',
    type: 'chat',
    trigger: '오늘 목표 티어 뭐야?',
    response: '오늘은 다이아 승급전 도전이래요! 다들 응원 부탁드려요 💪',
    user: 'supporter',
  },
  {
    id: '8',
    timestamp: '15:10:18',
    type: 'auto',
    trigger: '[자동 반응] 연속 3킬 달성',
    response: '와아! 트리플킬이다!! 진짜 멋있어! 이 기세로 쭉쭉 밀어붙이자!',
  },
];

export function ResponseLog() {
  const [selectedDate, setSelectedDate] = useState('2024-04-05');
  const [activeFilter, setActiveFilter] = useState<LogType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { id: 'all', label: '전체', count: 127 },
    { id: 'chat', label: '채팅 반응', count: 85 },
    { id: 'call', label: '호출 대화', count: 23 },
    { id: 'blocked', label: '필터링 차단', count: 12 },
    { id: 'auto', label: '자동 반응', count: 7 },
  ] as const;

  const filteredLogs = mockLogs.filter((log) => {
    const matchesFilter = activeFilter === 'all' || log.type === activeFilter;
    const matchesSearch = 
      searchQuery === '' ||
      log.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.response.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return MessageSquare;
      case 'call':
        return Mic2;
      case 'blocked':
        return Shield;
      case 'auto':
        return Zap;
      default:
        return MessageSquare;
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'chat':
        return { label: '채팅 반응', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'call':
        return { label: '호출 대화', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'blocked':
        return { label: '차단됨', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'auto':
        return { label: '자동 반응', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      default:
        return { label: '기타', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    }
  };

  const handleExport = () => {
    // CSV 내보내기 로직 (실제로는 백엔드 API 호출)
    console.log('Exporting logs to CSV...');
    alert('로그 내보내기 기능은 곧 지원됩니다.');
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-slate-950">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">응답 로그</h2>
        <p className="text-slate-400 text-sm">AI의 실시간 반응 기록 및 분석</p>
      </div>

      {/* 필터 바 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          {/* 날짜 선택 */}
          <div className="flex-shrink-0">
            <label className="block text-xs text-slate-400 mb-2">방송 날짜</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024-04-05">2024년 4월 5일 (오늘)</option>
              <option value="2024-04-04">2024년 4월 4일</option>
              <option value="2024-04-03">2024년 4월 3일</option>
              <option value="2024-04-02">2024년 4월 2일</option>
            </select>
          </div>

          {/* 검색 */}
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-2">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="키워드로 로그 검색..."
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-2 pt-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as LogType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 로그 리스트 */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 text-center">
            <p className="text-slate-400">검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getLogBadge(log.type);
            const Icon = getLogIcon(log.type);
            const isBlocked = log.type === 'blocked';

            return (
              <div
                key={log.id}
                className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">{log.timestamp}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${badge.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {badge.label}
                    </div>
                  </div>
                  {log.user && (
                    <div className="text-xs text-slate-500">
                      {log.user}
                    </div>
                  )}
                </div>

                {/* 내용 */}
                <div className="space-y-3">
                  {/* 트리거 */}
                  <div className={`p-3 rounded-lg ${isBlocked ? 'bg-red-900/20 border border-red-500/30' : 'bg-slate-800'}`}>
                    <div className="text-xs text-slate-500 mb-1">
                      {log.type === 'call' ? '스트리머 호출' : log.type === 'auto' ? '자동 트리거' : '채팅'}
                    </div>
                    <div className={`text-sm ${isBlocked ? 'text-red-400/60 line-through' : 'text-slate-300'}`}>
                      {log.trigger}
                    </div>
                  </div>

                  {/* AI 응답 */}
                  {!isBlocked && log.response && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xs text-blue-400 mb-1">AI 응답 (TTS 출력)</div>
                      <div className="text-sm text-blue-100">{log.response}</div>
                    </div>
                  )}

                  {/* 차단 표시 */}
                  {isBlocked && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400 font-medium">안전 필터에 의해 차단됨</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 하단 요약 바 */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 sticky bottom-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-xs text-slate-400 mb-1">총 반응 횟수</div>
              <div className="text-2xl font-semibold text-white">127</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">차단된 응답</div>
              <div className="text-2xl font-semibold text-red-400">12</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">호출 대화</div>
              <div className="text-2xl font-semibold text-green-400">23</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">평균 응답 시간</div>
              <div className="text-2xl font-semibold text-blue-400">1.2초</div>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV 내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
