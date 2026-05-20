/**
 * @file 실시간 대화/활동 로그 우측 드로어 패널
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 *
 * Discord sidebar style Log Panel (No icons, text based)
 */

import { useEffect } from "react";
import type { ActivityLog } from "@/shared/stores/aiModeStore";

interface ActivityLogPanelProps {
  open: boolean;
  logs: ActivityLog[];
  onClose: () => void;
}

const TYPE_LABEL: Record<ActivityLog["type"], string> = {
  reaction: "REAC",
  system: "SYS",
  chat: "CHAT",
  emotion: "EMOT",
  persona: "PERS",
};

const LEVEL_TEXT_CLASS: Record<NonNullable<ActivityLog["level"]>, string> = {
  info: "text-content-secondary",
  warning: "text-status-warning",
  error: "text-status-danger",
};

function formatTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ActivityLogPanel({ open, logs, onClose }: ActivityLogPanelProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const sorted = [...logs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div
      className={`fixed inset-0 z-40 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* 백그라운드 딤 (클릭 시 닫힘) */}
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        aria-label="대화 기록 패널 닫기"
        tabIndex={-1}
      />

      {/* 우측 드로어 패널 (디스코드 쓰레드/사이드바 스타일) */}
      <aside
        role="complementary"
        aria-label="실시간 대화 기록 로그"
        className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-border-default bg-surface-panel shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-default px-4">
          <div className="flex items-center gap-2">
            
            <h2 className="text-lg font-bold text-content-primary">활동 로그</h2>
            <span className="ml-2 rounded-full bg-surface-raised px-1.5 py-0.5 text-xs font-bold text-content-muted">
              {logs.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="대화 기록 닫기"
            className="text-base font-bold text-content-muted transition-colors hover:text-content-primary"
          >
            ESC
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          {sorted.length === 0 ? (
            <p className="py-12 text-center text-base font-medium text-content-muted">
              기록된 활동이 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {sorted.map((log) => {
                const level = log.level ?? "info";
                return (
                  <li
                    key={log.id}
                    className="group flex items-start gap-3 rounded-md px-2 py-1 transition-colors hover:bg-surface-hover"
                  >
                    <time className="mt-0.5 w-[55px] shrink-0 text-[10px] font-mono text-content-muted opacity-0 transition-opacity group-hover:opacity-100">
                      {formatTime(log.timestamp)}
                    </time>
                    <div className="min-w-0 flex-1">
                      <p className={`text-base leading-snug ${LEVEL_TEXT_CLASS[level]}`}>
                        <span className="mr-2 inline-flex items-center justify-center rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-content-muted">
                          {TYPE_LABEL[log.type]}
                        </span>
                        {log.message}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
