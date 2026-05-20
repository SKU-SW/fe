/**
 * @file 대시보드 하단 KPI 카드 (재사용)
 * Discord style
 * @usedBy src/pages/DashboardPage.tsx
 */

import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tag?: string;
  tone?: "emerald" | "indigo" | "amber" | "rose";
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, { dot: string; value: string; tag: string; iconBg: string; iconText: string }> = {
  emerald: {
    dot: "bg-status-success",
    value: "text-content-primary",
    tag: "border-border-strong bg-surface-raised text-status-success",
    iconBg: "bg-status-success/15",
    iconText: "text-status-success",
  },
  indigo: {
    dot: "bg-brand",
    value: "text-content-primary",
    tag: "border-border-strong bg-surface-raised text-brand",
    iconBg: "bg-brand/15",
    iconText: "text-brand",
  },
  amber: {
    dot: "bg-status-warning",
    value: "text-content-primary",
    tag: "border-border-strong bg-surface-raised text-status-warning",
    iconBg: "bg-status-warning/15",
    iconText: "text-status-warning",
  },
  rose: {
    dot: "bg-status-danger",
    value: "text-content-primary",
    tag: "border-border-strong bg-surface-raised text-status-danger",
    iconBg: "bg-status-danger/15",
    iconText: "text-status-danger",
  },
};

export function KpiCard({ icon: Icon, label, value, hint, tag, tone = "emerald" }: KpiCardProps) {
  const t = TONE_CLASSES[tone];

  return (
    <div className="relative overflow-hidden rounded-lg border border-border-strong bg-surface-panel p-4 shadow-sm transition-colors">
      {tag && (
        <span className={`absolute right-3 top-3 inline-flex rounded border px-2 py-0.5 text-xs font-bold ${t.tag}`}>
          {tag}
        </span>
      )}

      {!tag && (
        <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${t.dot}`} aria-hidden />
      )}

      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded p-2 ${t.iconBg}`}>
          <Icon className={`h-4 w-4 ${t.iconText}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-content-muted">{label}</p>
          <p className={`mt-0.5 text-2xl font-extrabold ${t.value}`}>{value}</p>
          {hint && <p className="mt-1 text-xs font-medium text-content-muted">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
