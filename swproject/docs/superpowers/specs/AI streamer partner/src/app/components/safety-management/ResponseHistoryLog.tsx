import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Download, CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  originalResponse: string;
  status: 'normal' | 'filtered' | 'replaced';
  replacedResponse?: string;
  filterReason?: string;
}

export function ResponseHistoryLog() {
  const [expanded, setExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '14:23:45',
      originalResponse: '오 이번 플레이 진짜 멋있었어요! 채팅이 다들 감탄하고 있네요!',
      status: 'normal',
    },
    {
      id: '2',
      timestamp: '14:22:18',
      originalResponse: '아 방금 그건 좀... [필터링된 부적절한 표현]... 실수네요.',
      status: 'filtered',
      filterReason: '비속어 감지',
    },
    {
      id: '3',
      timestamp: '14:21:03',
      originalResponse: '이번 판 [특정인물A] 같은데요? ㅋㅋㅋ',
      status: 'replaced',
      replacedResponse: '이번 판 재미있네요! 다들 즐기고 있는 것 같아요.',
      filterReason: '금지어 감지 (특정인물)',
    },
    {
      id: '4',
      timestamp: '14:19:47',
      originalResponse: '오늘 컨디션 좋으신 것 같아요! 계속 이 페이스로 가시죠!',
      status: 'normal',
    },
    {
      id: '5',
      timestamp: '14:18:22',
      originalResponse: '방금 채팅에 [개인정보]가 올라왔는데, 넘어갈게요~',
      status: 'replaced',
      replacedResponse: '방금 채팅에 부적절한 내용이 있어서 넘어갈게요~',
      filterReason: '개인정보 노출 차단',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            정상 출력
          </div>
        );
      case 'filtered':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
            <XCircle className="w-3 h-3" />
            필터링됨
          </div>
        );
      case 'replaced':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
            <RefreshCw className="w-3 h-3" />
            대체 출력
          </div>
        );
      default:
        return null;
    }
  };

  const handleDownloadLog = () => {
    // Mock download functionality
    console.log('Downloading logs...');
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      {/* 섹션 헤더 */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-white font-semibold text-lg">AI 응답 이력 로그</h3>
              <p className="text-sm text-slate-400">방송 중 AI가 생성한 모든 응답 기록</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadLog}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              로그 다운로드
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 섹션 내용 */}
      {expanded && (
        <div className="p-6">
          {/* 통계 요약 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg text-center">
              <p className="text-xs text-slate-400 mb-1">전체 응답</p>
              <p className="text-2xl font-semibold text-white">{logs.length}</p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
              <p className="text-xs text-green-400 mb-1">정상 출력</p>
              <p className="text-2xl font-semibold text-green-400">
                {logs.filter(l => l.status === 'normal').length}
              </p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <p className="text-xs text-red-400 mb-1">필터링</p>
              <p className="text-2xl font-semibold text-red-400">
                {logs.filter(l => l.status === 'filtered').length}
              </p>
            </div>
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
              <p className="text-xs text-orange-400 mb-1">대체 출력</p>
              <p className="text-2xl font-semibold text-orange-400">
                {logs.filter(l => l.status === 'replaced').length}
              </p>
            </div>
          </div>

          {/* 로그 목록 */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
                    {getStatusBadge(log.status)}
                    {log.filterReason && (
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {log.filterReason}
                      </span>
                    )}
                  </div>
                  {(log.status === 'filtered' || log.status === 'replaced') && (
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      상세보기
                    </button>
                  )}
                </div>

                {/* 응답 내용 */}
                {log.status === 'normal' && (
                  <p className="text-sm text-slate-200">{log.originalResponse}</p>
                )}
                {log.status === 'filtered' && (
                  <p className="text-sm text-red-400 line-through">{log.originalResponse}</p>
                )}
                {log.status === 'replaced' && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">대체된 응답:</p>
                      <p className="text-sm text-green-400">{log.replacedResponse}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-slate-800 border border-slate-600 rounded-xl p-6 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">응답 비교</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 원본 응답 */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-medium text-red-400">원본 응답 (차단됨)</p>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{selectedLog.originalResponse}</p>
                {selectedLog.filterReason && (
                  <p className="text-xs text-red-400 mt-2">차단 사유: {selectedLog.filterReason}</p>
                )}
              </div>

              {/* 대체 응답 */}
              {selectedLog.replacedResponse && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <p className="text-sm font-medium text-green-400">대체 응답 (출력됨)</p>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{selectedLog.replacedResponse}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
