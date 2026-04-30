/**
 * @file 대시보드 하단 KPI 카드 (재사용)
 * @usedBy src/pages/DashboardPage.tsx
 */

import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  /** 핵심 수치 (큰 글씨) */
  value: string;
  /** 보조 설명 (작은 글씨) — 예: "+32명 (5분 전)", "평균보다 높음" */
  hint?: string;
  /** 우상단 태그 (예: "리그오브레전드") */
  tag?: string;
  /** 카드 강조 색 — 기본 emerald */
  tone?: "emerald" | "indigo" | "amber" | "rose";
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, { dot: string; value: string; tag: string; iconBg: string; iconText: string }> = {
  emerald: {
    dot: "bg-emerald-400",
    value: "text-emerald-300",
    tag: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-300",
  },
  indigo: {
    dot: "bg-indigo-400",
    value: "text-indigo-300",
    tag: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
    iconBg: "bg-indigo-500/15",
    iconText: "text-indigo-300",
  },
  amber: {
    dot: "bg-amber-400",
    value: "text-amber-300",
    tag: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-300",
  },
  rose: {
    dot: "bg-rose-400",
    value: "text-rose-300",
    tag: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-300",
  },
};

export function KpiCard({ icon: Icon, label, value, hint, tag, tone = "emerald" }: KpiCardProps) {
  const t = TONE_CLASSES[tone];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
      {/* 우상단 태그 */}
      {tag && (
        <span className={`absolute right-3 top-3 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-medium ${t.tag}`}>
          {tag}
        </span>
      )}

      {/* 우상단 라이브 닷 (태그가 없을 때만) */}
      {!tag && (
        <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${t.dot} animate-pulse`} aria-hidden />
      )}

      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-lg p-2 ${t.iconBg}`}>
          <Icon className={`h-4 w-4 ${t.iconText}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${t.value}`}>{value}</p>
          {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
