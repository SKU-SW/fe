import { Bot, Users, MessageSquare, Smile } from "lucide-react";
import { StatusCard } from "./StatusCard";
import { ControlPanel } from "./ControlPanel";
import { ChatMonitor } from "./ChatMonitor";
import { AIActivityLog } from "./AIActivityLog";
import { SettingsPanel } from "./SettingsPanel";
import { QuickControlBar } from "./QuickControlBar";

export function Dashboard() {
  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      {/* Header with Quick Controls */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">대시보드</h2>
          <p className="text-slate-400 text-sm">AI 스트리머 동료 시스템 실시간 모니터링</p>
        </div>
        <QuickControlBar />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          title="AI 상태"
          value="활성화"
          icon={Bot}
          status="active"
          subtitle="정상 작동 중"
        />
        <StatusCard
          title="현재 시청자 수"
          value="1,247"
          icon={Users}
          status="active"
          subtitle="+32명 (5분 전)"
          badge="리그오브레전드"
        />
        <StatusCard
          title="채팅 속도"
          value="42개/분"
          icon={MessageSquare}
          status="active"
          subtitle="평균보다 높음"
        />
        <StatusCard
          title="실시간 감정 비율"
          value="긍정 73%"
          icon={Smile}
          status="active"
          subtitle="중립 20% · 부정 7%"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <ControlPanel />
          <SettingsPanel />
        </div>

        <div className="space-y-6">
          <ChatMonitor />
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <AIActivityLog />
      </div>
    </div>
  );
}