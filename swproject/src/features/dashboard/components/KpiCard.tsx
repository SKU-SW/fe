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
    dot: "bg-[#23a559]",
    value: "text-[#f2f3f5]",
    tag: "border-[#1e1f22] bg-[#1e1f22] text-[#23a559]",
    iconBg: "bg-[#23a559]/20",
    iconText: "text-[#23a559]",
  },
  indigo: {
    dot: "bg-[#5865F2]",
    value: "text-[#f2f3f5]",
    tag: "border-[#1e1f22] bg-[#1e1f22] text-[#5865F2]",
    iconBg: "bg-[#5865F2]/20",
    iconText: "text-[#5865F2]",
  },
  amber: {
    dot: "bg-[#f0b232]",
    value: "text-[#f2f3f5]",
    tag: "border-[#1e1f22] bg-[#1e1f22] text-[#f0b232]",
    iconBg: "bg-[#f0b232]/20",
    iconText: "text-[#f0b232]",
  },
  rose: {
    dot: "bg-[#f23f42]",
    value: "text-[#f2f3f5]",
    tag: "border-[#1e1f22] bg-[#1e1f22] text-[#f23f42]",
    iconBg: "bg-[#f23f42]/20",
    iconText: "text-[#f23f42]",
  },
};

export function KpiCard({ icon: Icon, label, value, hint, tag, tone = "emerald" }: KpiCardProps) {
  const t = TONE_CLASSES[tone];

  return (
    <div className="relative overflow-hidden rounded bg-[#2b2d31] border border-[#1e1f22] p-4">
      {tag && (
        <span className={`absolute right-3 top-3 inline-flex rounded border px-2 py-0.5 text-[10px] font-bold ${t.tag}`}>
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">{label}</p>
          <p className={`mt-0.5 text-xl font-extrabold ${t.value}`}>{value}</p>
          {hint && <p className="mt-1 text-[11px] font-medium text-[#949ba4]">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
