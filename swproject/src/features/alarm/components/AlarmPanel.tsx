/**
 * @file 대시보드 헤더 알람 드롭다운 패널
 * @dependsOn react, lucide-react
 * @dependsOn src/shared/stores/alarmStore.ts
 * @dependsOn src/shared/lib/formatAlarmTime.ts
 * @usedBy src/components/layouts/DashboardHeader.tsx
 */

import { useEffect, useRef } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { formatAlarmTime } from "@/shared/lib/formatAlarmTime";
import { useAlarmStore } from "@/shared/stores/alarmStore";

interface AlarmPanelProps {
  triggerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

const SEVERITY_DOT_CLASS = {
  info: "bg-content-muted",
  warning: "bg-status-warning",
  error: "bg-status-danger",
} as const;

export function AlarmPanel({ triggerRef, onClose }: AlarmPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const entries = useAlarmStore((s) => s.entries);
  const markAllRead = useAlarmStore((s) => s.markAllRead);
  const clearAll = useAlarmStore((s) => s.clearAll);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, triggerRef]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[22.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border-strong bg-surface-panel shadow-xl"
      role="dialog"
      aria-label="알람 패널"
    >
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h3 className="text-sm font-semibold text-content-primary">알람</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            모두 읽음
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
          >
            <Trash2 className="h-3.5 w-3.5" />
            전체 삭제
          </button>
        </div>
      </div>

      <div className="max-h-[30rem] overflow-y-auto px-2 py-2">
        {entries.length === 0 ? (
          <div className="flex min-h-36 items-center justify-center rounded-lg px-4 text-sm text-content-muted">
            아직 알람이 없어요
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`rounded-lg border px-3 py-3 transition-colors ${
                  entry.read
                    ? "border-transparent bg-surface-panel"
                    : "border-border-default bg-surface-raised"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOT_CLASS[entry.severity]}`}
                    />
                    {!entry.read && <span className="h-2 w-2 rounded-full bg-status-danger/80" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-content-primary">{entry.text}</p>
                    <p className="mt-1 text-xs text-content-muted">
                      {formatAlarmTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
