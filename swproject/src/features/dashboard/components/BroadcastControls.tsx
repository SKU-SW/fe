/**
 * @file 방송 컨트롤 바
 * - 좌측: 마이크 / 스피커 / 선제 반응 / AI 동작
 * - 우측: (삭제됨 - BroadcastHeader로 이동)
 * @usedBy src/pages/DashboardPage.tsx
 */

interface BroadcastControlsProps {
  sttOn: boolean;
  proactiveOn: boolean;
  ttsOn: boolean;
  chatLogOn?: boolean;
  aiOn: boolean;
  onToggleStt: () => void;
  onToggleProactive: () => void;
  onToggleTts: () => void;
  onToggleChatLog?: () => void;
  onToggleAi: () => void;
  onEmotionAction?: () => void;
}

export function BroadcastControls({
  sttOn,
  proactiveOn,
  ttsOn,
  aiOn,
  onToggleStt,
  onToggleProactive,
  onToggleTts,
  onToggleAi,
  onEmotionAction,
}: BroadcastControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded bg-[#2b2d31] px-4 py-3 border border-[#1e1f22]">
      <div className="flex flex-wrap items-center gap-6">
        <ToggleSwitch label="마이크" on={sttOn} onClick={onToggleStt} />
        <ToggleSwitch label="스피커" on={ttsOn} onClick={onToggleTts} />
        <ToggleSwitch label="선제 반응" on={proactiveOn} onClick={onToggleProactive} />
        <ToggleSwitch label="AI 동작" on={aiOn} onClick={onToggleAi} />
      </div>

      {onEmotionAction && (
        <button
          type="button"
          onClick={onEmotionAction}
          className="rounded bg-[#1e1f22] px-3 py-1.5 text-xs font-bold text-[#dbdee1] transition hover:bg-[#3f4147]"
        >
          감정 테스트
        </button>
      )}
    </div>
  );
}

function ToggleSwitch({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-[#949ba4]">{label}</span>
      <button
        type="button"
        onClick={onClick}
        role="switch"
        aria-checked={on}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          on ? "bg-[#23a559]" : "bg-[#4e5058]"
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
