import { Settings, ChevronRight } from 'lucide-react';
import { Switch } from '../ui/switch';

export function SensitivitySettings() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-slate-400" />
        <h3 className="text-white font-semibold text-lg">민감도 설정</h3>
      </div>

      {/* 현재 민감도 */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-3">현재 민감도</p>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
            낮음
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white">
            보통
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
            높음
          </button>
        </div>
      </div>

      {/* 채팅 반응 토글 */}
      <div className="mb-6 pb-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white mb-1">채팅 반응</p>
            <p className="text-xs text-slate-400">AI 자동 응답 활성화</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      {/* 현재 설정 요약 */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">반응 민감도</span>
          <span className="text-white font-medium">50%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">선제 반응 빈도</span>
          <span className="text-white font-medium">30초</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">음성 출력 속도</span>
          <span className="text-white font-medium">1.0x</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">음성 음량</span>
          <span className="text-white font-medium">70%</span>
        </div>
      </div>

      {/* 상세 설정 버튼 */}
      <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors group">
        <span className="text-sm font-medium text-white">상세 설정</span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
      </button>

      {/* 통계 요약 */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-3">오늘의 통계</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">AI 응답</p>
            <p className="text-lg font-semibold text-blue-400">247개</p>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">정확도</p>
            <p className="text-lg font-semibold text-green-400">94%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
