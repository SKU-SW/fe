/**
 * @file 실시간 대화/활동 로그 우측 드로어 패널
 * @dependsOn src/shared/stores/aiModeStore.ts (ActivityLog 타입)
 * @usedBy src/pages/DashboardPage.tsx
 *
 * - BroadcastHeader의 "대화 기록" 토글로 열고 닫음
 * - 우측 고정 드로어, ESC 키로도 닫힘
 * - 최신 로그가 위로 (역순 정렬)
 */

import { useEffect } from "react";
import {
  Activity,
  Info,
  MessageSquare,
  ScrollText,
  Smile,
  User,
  X,
} from "lucide-react";
import type { ActivityLog } from "@/shared/stores/aiModeStore";

interface ActivityLogPanelProps {
  logs: ActivityLog[];
  onClose: () => void;
}

const TYPE_ICON: Record<ActivityLog["type"], typeof Info> = {
  reaction: Activity,
  system: Info,
  chat: MessageSquare,
  emotion: Smile,
  persona: User,
};

const LEVEL_TEXT_CLASS: Record<NonNullable<ActivityLog["level"]>, string> = {
  info: "text-slate-200",
  warning: "text-amber-300",
  error: "text-red-300",
};

const LEVEL_ICON_CLASS: Record<NonNullable<ActivityLog["level"]>, string> = {
  info: "text-slate-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

function formatTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ActivityLogPanel({ logs, onClose }: ActivityLogPanelProps) {
  // ESC 로 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 최신 로그 위로
  const sorted = [...logs].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <aside
      role="complementary"
      aria-label="실시간 대화 기록 로그"
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-700 bg-slate-900 shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-indigo-300" />
          <h2 className="text-sm font-semibold text-white">대화 기록</h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {logs.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="대화 기록 닫기"
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {sorted.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-500">
            아직 기록된 활동이 없습니다.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sorted.map((log) => {
              const Icon = TYPE_ICON[log.type] ?? Info;
              const level = log.level ?? "info";
              return (
                <li
                  key={log.id}
                  className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2"
                >
                  <Icon
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${LEVEL_ICON_CLASS[level]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-relaxed ${LEVEL_TEXT_CLASS[level]}`}>
                      {log.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {formatTime(log.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
