/**
 * @file 방송 컨트롤 바
 * - 좌측: 캐릭터 액션 (감정 / TTS 음성 출력 토글)
 * - 우측: 대화 기록 ON/OFF / AI 동작 ON/OFF + 기록 초기화 트리거
 * @usedBy src/pages/DashboardPage.tsx
 */

import { Smile, Volume2, VolumeX, MessageSquare, Zap, RotateCcw } from "lucide-react";

interface BroadcastControlsProps {
  /** TTS (음성 출력) ON 여부 */
  ttsOn: boolean;
  /** 채팅 기록(반응) ON 여부 */
  chatLogOn: boolean;
  /** AI 동작 ON 여부 */
  aiOn: boolean;
  onToggleTts: () => void;
  onToggleChatLog: () => void;
  onToggleAi: () => void;
  /** 기록 초기화 클릭 (모달 트리거) */
  onResetRecords: () => void;
  /** 감정 표현 수동 트리거 (선택) */
  onEmotionAction?: () => void;
}

export function BroadcastControls({
  ttsOn,
  chatLogOn,
  aiOn,
  onToggleTts,
  onToggleChatLog,
  onToggleAi,
  onResetRecords,
  onEmotionAction,
}: BroadcastControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
      {/* 좌측: 캐릭터 액션 */}
      <div className="flex items-center gap-2">
        {onEmotionAction && (
          <IconAction onClick={onEmotionAction} label="감정 표현" icon={<Smile className="h-4 w-4" />} />
        )}
        <IconAction
          onClick={onToggleTts}
          label={ttsOn ? "음성 출력 끄기" : "음성 출력 켜기"}
          icon={ttsOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          active={ttsOn}
        />
      </div>

      {/* 우측: 동작 토글 + 기록 초기화 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetRecords}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
          aria-label="기록 초기화"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          기록 초기화
        </button>

        <ToggleSwitch
          icon={<MessageSquare className="h-4 w-4" />}
          label="대화 기록"
          on={chatLogOn}
          onClick={onToggleChatLog}
        />
        <ToggleSwitch
          icon={<Zap className="h-4 w-4" />}
          label="AI 동작"
          on={aiOn}
          onClick={onToggleAi}
        />
      </div>
    </div>
  );
}

function IconAction({
  onClick,
  label,
  icon,
  active = false,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        active
          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
          : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function ToggleSwitch({
  icon,
  label,
  on,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        on
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
          : "border-slate-700 bg-slate-800/60 text-slate-400"
      }`}
      aria-pressed={on}
      aria-label={`${label} ${on ? "ON" : "OFF"}`}
    >
      <span className={on ? "text-emerald-300" : "text-slate-500"}>{icon}</span>
      <span>{label}</span>
      <span
        className={`ml-1 inline-flex w-7 justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          on ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
        }`}
      >
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}
