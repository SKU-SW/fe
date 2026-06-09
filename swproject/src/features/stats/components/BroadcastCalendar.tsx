/**
 * @file 방송 히스토리 캘린더 — 월별 그리드 + 선택 날짜 상세 패널
 * @dependsOn src/features/stats/lib/broadcastHistoryMock.ts
 * @usedBy src/pages/StatsHistoryPage.tsx
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Hash, MessageSquare, Timer, X } from "lucide-react";
import {
  dominantSentiment,
  type BroadcastHistoryEntry,
  type SentimentLabel,
} from "@/features/stats/lib/broadcastHistoryMock";

interface BroadcastCalendarProps {
  entries: BroadcastHistoryEntry[];
}

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const SENTIMENT_LABEL: Record<SentimentLabel, string> = {
  positive: "긍정 우세",
  neutral: "중립 우세",
  negative: "부정 우세",
};

const SENTIMENT_CELL_CLASS: Record<SentimentLabel, string> = {
  positive: "border-status-success/30 bg-status-success/10 text-status-success",
  neutral: "border-border-default bg-surface-raised text-content-secondary",
  negative: "border-status-danger/30 bg-status-danger/10 text-status-danger",
};

const SENTIMENT_DOT_CLASS: Record<SentimentLabel, string> = {
  positive: "bg-status-success",
  neutral: "bg-content-muted",
  negative: "bg-status-danger",
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

interface CalendarCell {
  date: Date;
  key: string;
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
      key: formatDateKey(d),
      inMonth: d.getMonth() === cursor.getMonth(),
    };
  });
}

export function BroadcastCalendar({ entries }: BroadcastCalendarProps) {
  const [cursorMonth, setCursorMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, BroadcastHistoryEntry[]>();
    entries.forEach((entry) => {
      const existing = map.get(entry.date) ?? [];
      existing.push(entry);
      map.set(entry.date, existing);
    });
    return map;
  }, [entries]);

  const cells = useMemo(() => buildMonthCells(cursorMonth), [cursorMonth]);
  const today = new Date();
  const selectedEntries = selectedKey ? entriesByDate.get(selectedKey) ?? [] : [];
  const selectedEntry = selectedEntries[0] ?? null;

  const monthLabel = `${cursorMonth.getFullYear()}년 ${cursorMonth.getMonth() + 1}월`;
  const monthlyCount = cells.filter((c) => c.inMonth && entriesByDate.has(c.key)).length;

  const goPrevMonth = () => {
    setCursorMonth((cur) => new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setCursorMonth((cur) => new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  };
  const goToday = () => {
    setCursorMonth(startOfMonth(new Date()));
    setSelectedKey(formatDateKey(new Date()));
  };

  const handleCloseDetail = () => setSelectedKey(null);

  useEffect(() => {
    if (selectedEntries.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCloseDetail();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedEntries.length]);

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
                이번 달 방송 {monthlyCount}회 기록됨
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
          {cells.map((cell) => {
            const dayEntries = entriesByDate.get(cell.key) ?? [];
            const isToday = isSameDay(cell.date, today);
            const isSelected = selectedKey === cell.key;
            const isWeekendSun = cell.date.getDay() === 0;
            const isWeekendSat = cell.date.getDay() === 6;

            const baseCellClass = "relative flex aspect-square flex-col rounded-md border p-1.5 text-left transition-all";
            const dimClass = cell.inMonth ? "" : "opacity-40";
            const hasEntry = dayEntries.length > 0;
            const cellBgClass = hasEntry
              ? "border-brand/30 bg-brand/5 hover:bg-brand/10"
              : "border-border-default bg-surface-base hover:bg-surface-hover";
            const selectedClass = isSelected ? "ring-2 ring-brand ring-offset-1 ring-offset-surface-panel" : "";
            const todayClass = isToday && !isSelected ? "ring-1 ring-brand/60" : "";

            return (
              <button
                type="button"
                key={cell.key}
                onClick={() => setSelectedKey(cell.key)}
                disabled={!hasEntry}
                className={`${baseCellClass} ${cellBgClass} ${dimClass} ${selectedClass} ${todayClass} disabled:cursor-default`}
              >
                <span
                  className={`text-xs font-extrabold ${
                    isWeekendSun ? "text-status-danger" : isWeekendSat ? "text-brand" : "text-content-primary"
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                {hasEntry && (
                  <div className="mt-auto flex flex-col gap-0.5 overflow-hidden">
                    {dayEntries.map((entry, index) => (
                      <span
                        key={index}
                        className="truncate rounded bg-brand/20 px-1 py-0.5 text-[9px] font-bold text-brand"
                        title={entry.title}
                      >
                        {entry.characterName}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-content-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" />
            방송 기록 있음
          </span>
          <span className="ml-auto">하루 여러 번 방송 시 여러 줄로 표시</span>
        </footer>
      </section>


      {selectedEntries.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseDetail}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-border-strong bg-surface-panel p-5 shadow-2xl"
          >
            <BroadcastDetailModal
              date={selectedKey!}
              entries={selectedEntries}
              onClose={handleCloseDetail}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BroadcastDetailModal({
  date,
  entries,
  onClose,
}: {
  date: string;
  entries: BroadcastHistoryEntry[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-content-muted">{date}</p>
          <h3 className="mt-1 text-lg font-extrabold text-content-primary">
            방송 기록 {entries.length}건
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="rounded-lg border border-border-default bg-surface-raised p-1.5 text-content-secondary transition-colors hover:bg-surface-hover"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 각 방송별 카드 */}
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <BroadcastDetailCard key={index} entry={entry} index={index} />
        ))}
      </div>
    </div>
  );
}

function BroadcastDetailCard({
  entry,
  index,
}: {
  entry: BroadcastHistoryEntry;
  index: number;
}) {
  const sentiment = dominantSentiment(entry);

  return (
    <div className="rounded-xl border border-border-default bg-surface-base p-4">
      {/* 카드 헤더 */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-content-muted">방송 #{index + 1}</p>
          <h4 className="mt-0.5 text-base font-extrabold text-content-primary">{entry.title}</h4>
          <p className="mt-0.5 text-xs text-content-muted">캐릭터: {entry.characterName}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${SENTIMENT_CELL_CLASS[sentiment]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${SENTIMENT_DOT_CLASS[sentiment]}`} />
          {SENTIMENT_LABEL[sentiment]}
        </span>
      </div>

      {/* 감정 비율 + 메트릭 */}
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-border-default bg-surface-panel p-3">
          <p className="mb-2 text-xs font-bold text-content-muted">감정 비율</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-raised">
            <span className="bg-status-success" style={{ width: `${entry.positiveRatio}%` }} />
            <span className="bg-content-muted/40" style={{ width: `${entry.neutralRatio}%` }} />
            <span className="bg-status-danger" style={{ width: `${entry.negativeRatio}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-bold">
            <span className="text-status-success">긍정 {entry.positiveRatio}%</span>
            <span className="text-content-muted">중립 {entry.neutralRatio}%</span>
            <span className="text-status-danger">부정 {entry.negativeRatio}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DetailMetric icon={MessageSquare} label="총 채팅" value={entry.totalChats.toLocaleString()} />
          <DetailMetric icon={Timer} label="방송 시간" value={`${entry.durationMinutes}분`} />
        </div>
      </div>

      {/* TOP 키워드 */}
      <div className="mt-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-content-muted">
          <Hash className="h-3.5 w-3.5" />
          TOP 키워드
        </p>
        <div className="flex flex-wrap gap-1.5">
          {entry.topKeywords.map((keyword, kIndex) => (
            <span
              key={keyword}
              className="rounded-full border border-border-default bg-surface-panel px-2.5 py-1 text-xs font-bold text-content-secondary"
            >
              <span className="mr-1 text-content-muted">#{kIndex + 1}</span>
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-base p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-content-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-base font-extrabold text-content-primary">{value}</p>
    </div>
  );
}
