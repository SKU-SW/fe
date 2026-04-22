import { Shield, Clock, Hash, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsSummaryBarProps {
  blockedWordCount: number;
  filterEnabled: boolean;
  lastUpdated: string;
}

export function SettingsSummaryBar({ blockedWordCount, filterEnabled, lastUpdated }: SettingsSummaryBarProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* 금지어 수 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Hash className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">등록된 금지어</p>
              <p className="text-lg font-semibold text-white">{blockedWordCount}개</p>
            </div>
          </div>

          {/* AI 필터 상태 */}
          <div className="h-12 w-px bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              filterEnabled ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {filterEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400">AI 자동 필터</p>
              <p className={`text-lg font-semibold ${
                filterEnabled ? 'text-green-400' : 'text-red-400'
              }`}>
                {filterEnabled ? '활성화' : '비활성화'}
              </p>
            </div>
          </div>

          {/* 마지막 변경 시각 */}
          <div className="h-12 w-px bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">마지막 변경</p>
              <p className="text-sm font-medium text-slate-300">{lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* 전체 설정 상태 배지 */}
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">보호 활성화</span>
        </div>
      </div>
    </div>
  );
}
