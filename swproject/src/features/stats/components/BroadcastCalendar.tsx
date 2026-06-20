/**
 * @file 방송 히스토리 캘린더 — 월별 그리드 + 일별 통계 오버레이 모달
 * @dependsOn src/features/stats/hooks/useBroadcastMonth.ts
 * @dependsOn src/features/stats/hooks/useBroadcastDayStats.ts
 * @dependsOn src/features/stats/components/BroadcastDayDetailModal.tsx
 * @usedBy src/pages/StatsPage.tsx
 */

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type { BroadcastMonthInfo, BroadcastStatus } from "@/features/stats/types";
import { useBroadcastMonth } from "@/features/stats/hooks/useBroadcastMonth";
import { useBroadcastDayStats } from "@/features/stats/hooks/useBroadcastDayStats";
import { BroadcastDayDetailModal } from "./BroadcastDayDetailModal";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_LABEL: Record<BroadcastStatus, string> = {
  BROADCASTING: "방송 중",
  TERMINATED: "정상 종료",
  ABNORMAL_TERMINATED: "비정상 종료",
};

/** 셀 안의 작은 상태 점 색상 */
const STATUS_DOT_CLASS: Record<BroadcastStatus, string> = {
  BROADCASTING: "bg-status-success animate-pulse",
  TERMINATED: "bg-content-muted",
  ABNORMAL_TERMINATED: "bg-status-warning",
};

/** 셀 안의 캐릭터 칩(버튼) 톤 — 각 방송 한 줄 */
const STATUS_CHIP_CLASS: Record<BroadcastStatus, string> = {
  BROADCASTING: "border-status-success/40 bg-status-success/10 text-status-success hover:bg-status-success/20",
  TERMINATED: "border-border-default bg-surface-panel text-content-secondary hover:bg-surface-hover",
  ABNORMAL_TERMINATED: "border-status-warning/40 bg-status-warning/10 text-status-warning hover:bg-status-warning/20",
};

/** 셀 전체 배경 톤 — 해당 일자에 있는 방송 중 가장 강한 상태 우선 */
const STATUS_PRIORITY: BroadcastStatus[] = ["BROADCASTING", "ABNORMAL_TERMINATED", "TERMINATED"];
const STATUS_CELL_BG_CLASS: Record<BroadcastStatus, string> = {
  BROADCASTING: "border-status-success/40 bg-status-success/5",
  TERMINATED: "border-brand/20 bg-brand/5",
  ABNORMAL_TERMINATED: "border-status-warning/40 bg-status-warning/5",
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

interface CalendarCell {
  date: Date;
  day: number;
  inMonth: boolean;
}

function buildMonthCells(cursor: Date): CalendarCell[] {
  const start = startOfMonth(cursor);
  const firstDayOfWeek = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstDayOfWeek);

  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + index);
    return {
      date: d,
      day: d.getDate(),
      inMonth: d.getMonth() === cursor.getMonth(),
    };
  });
}

export function BroadcastCalendar() {
  const [cursorMonth, setCursorMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<number | null>(null);

  const year = cursorMonth.getFullYear();
  const month = cursorMonth.getMonth() + 1;
  const { entries, isLoading, error, refetch } = useBroadcastMonth(year, month);
  const dayStats = useBroadcastDayStats(selectedBroadcastId);

  // day → broadcasts[] 그룹핑 (하루에 여러 번 방송 가능)
  const broadcastsByDay = useMemo(() => {
    const map = new Map<number, BroadcastMonthInfo[]>();
    entries.forEach((entry) => {
      const list = map.get(entry.day) ?? [];
      list.push(entry);
      map.set(entry.day, list);
    });
    return map;
  }, [entries]);

  const cells = useMemo(() => buildMonthCells(cursorMonth), [cursorMonth]);
  const today = new Date();
  const monthLabel = `${year}년 ${month}월`;
  const monthlyTotal = entries.length;

  const goPrevMonth = () => {
    setCursorMonth((cur) => new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setCursorMonth((cur) => new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  };
  const goToday = () => {
    setCursorMonth(startOfMonth(new Date()));
  };

  return (
    <div className="relative">
      <section className="mx-auto max-w-3xl rounded-2xl border border-border-strong bg-surface-panel p-4 shadow-sm transition-colors">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-content-primary">{monthLabel}</h2>
              <p className="text-xs text-content-muted">
                {isLoading
                  ? "불러오는 중..."
                  : `이번 달 방송 ${monthlyTotal}회 기록됨`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => refetch()}
              aria-label="새로고침"
              className="rounded-lg border border-border-default bg-surface-raised p-1.5 text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="이전 달"
              className="rounded-lg border border-border-default bg-surface-raised p-1.5 text-content-secondary transition-colors hover:bg-surface-hover"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-bold text-content-secondary transition-colors hover:bg-surface-hover"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="다음 달"
              className="rounded-lg border border-border-default bg-surface-raised p-1.5 text-content-secondary transition-colors hover:bg-surface-hover"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs font-bold text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold text-content-muted">
          {WEEK_LABELS.map((label, index) => (
            <span
              key={label}
              className={index === 0 ? "text-status-danger" : index === 6 ? "text-brand" : ""}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, cellIndex) => {
            const dayBroadcasts = cell.inMonth ? broadcastsByDay.get(cell.day) ?? [] : [];
            const hasBroadcasts = dayBroadcasts.length > 0;
            const isToday = isSameDay(cell.date, today);
            const isWeekendSun = cell.date.getDay() === 0;
            const isWeekendSat = cell.date.getDay() === 6;

            const baseCellClass = "relative flex aspect-square flex-col overflow-hidden rounded-md border p-1 text-left transition-all";
            const dimClass = cell.inMonth ? "" : "opacity-40";
            // 한 셀에 여러 상태가 있으면 가장 강한 상태(라이브 > 비정상 > 정상)로 셀 배경 결정
            const dominantStatus = hasBroadcasts
              ? STATUS_PRIORITY.find((s) => dayBroadcasts.some((bc) => bc.broadcastStatus === s)) ?? null
              : null;
            const cellBgClass = dominantStatus
              ? STATUS_CELL_BG_CLASS[dominantStatus]
              : "border-border-default bg-surface-base";
            const todayClass = isToday ? "ring-1 ring-brand/60" : "";

            return (
              <div
                key={`${cellIndex}-${cell.day}`}
                className={`${baseCellClass} ${cellBgClass} ${dimClass} ${todayClass}`}
              >
                <span
                  className={`text-[10px] font-extrabold ${
                    isWeekendSun ? "text-status-danger" : isWeekendSat ? "text-brand" : "text-content-secondary"
                  }`}
                >
                  {cell.day}
                </span>

                {hasBroadcasts && (
                  <div className="mt-0.5 flex flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayBroadcasts.slice(0, 3).map((bc) => (
                      <button
                        key={bc.broadcastId}
                        type="button"
                        onClick={() => setSelectedBroadcastId(bc.broadcastId)}
                        title={`${bc.characterName} · ${STATUS_LABEL[bc.broadcastStatus]} · ${bc.broadcastTime}`}
                        className={`flex items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[9px] font-bold transition-colors ${STATUS_CHIP_CLASS[bc.broadcastStatus]}`}
                      >
                        <span className={`h-1 w-1 shrink-0 rounded-full ${STATUS_DOT_CLASS[bc.broadcastStatus]}`} />
                        <span className="truncate">{bc.characterName}</span>
                      </button>
                    ))}
                    {dayBroadcasts.length > 3 && (
                      <span className="text-center text-[9px] font-bold text-content-muted">
                        +{dayBroadcasts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold text-content-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS.BROADCASTING}`} />
            방송 중 (LIVE)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS.TERMINATED}`} />
            정상 종료
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS.ABNORMAL_TERMINATED}`} />
            비정상 종료
          </span>
          <span className="ml-auto">셀의 항목 클릭 → 방송 상세</span>
        </footer>

        {isLoading && (
          <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1.5 text-xs font-bold text-content-muted">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          </div>
        )}
      </section>

      {selectedBroadcastId !== null && (
        <BroadcastDayDetailModal
          data={dayStats.data}
          isLoading={dayStats.isLoading}
          error={dayStats.error}
          isNotFound={dayStats.isNotFound}
          onClose={() => setSelectedBroadcastId(null)}
        />
      )}
    </div>
  );
}
