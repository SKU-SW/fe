/**
 * @file 치지직 연동 상태 배지 — 사이드바 / 대시보드 등에서 재사용
 * @created Sprint Chzzk - 치지직 연동 UI
 * @updated Backend Swagger spec alignment - authorized boolean only (no expiry)
 * @dependsOn src/features/auth/hooks/useChzzkStatus.ts
 * @dependsOn public/icons/chzzk.png (치지직 공식 아이콘)
 * @usedBy src/components/layouts/DashboardSidebar.tsx
 * @usedBy src/features/dashboard/components/DashboardEmptyState.tsx
 *
 * Variants:
 * - "icon": 치지직 아이콘 + 우하단 상태 점 — 사이드바 collapsed
 * - "compact": 치지직 아이콘 + "치지직" 라벨 알약 — 사이드바 expanded
 * - "full": 큰 치지직 아이콘 + 상태 라벨 + 설명 + (선택) CTA — 대시보드 카드
 */

import { useMemo } from "react";
import { useChzzkStatus } from "@/features/auth/hooks/useChzzkStatus";

type BadgeStatus = "linked" | "not_linked" | "loading";

interface ChzzkStatusBadgeProps {
  variant: "icon" | "compact" | "full";
  /** CTA(연동하기/재연결) 버튼 노출 여부 — variant="full"에서만 유효 */
  showCTA?: boolean;
  /** CTA 버튼 클릭 핸들러 — 보통 부모에서 모달 오픈 */
  onConnectClick?: () => void;
}

const CHZZK_ICON_SRC = "/icons/chzzk.png";

export function ChzzkStatusBadge({ variant, showCTA = false, onConnectClick }: ChzzkStatusBadgeProps) {
  const { status, isLoading } = useChzzkStatus();

  const badgeStatus: BadgeStatus = useMemo(() => {
    if (isLoading || !status) return "loading";
    if (status.authorized) return "linked";
    return "not_linked";
  }, [isLoading, status]);

  const config = STATUS_CONFIG[badgeStatus];

  if (variant === "icon") {
    return (
      <span
        className="relative inline-flex"
        title={`치지직: ${config.label}`}
        aria-label={`치지직: ${config.label}`}
      >
        <img
          src={CHZZK_ICON_SRC}
          alt=""
          className={`h-4 w-4 rounded-sm ${config.iconOpacity}`}
          draggable={false}
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full ring-1 ring-surface-sidebar ${config.dotClass}`}
        />
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full pl-1 pr-2 py-0.5 text-[10px] font-medium ${config.compactBgClass}`}
        title={`치지직: ${config.label}`}
      >
        <img
          src={CHZZK_ICON_SRC}
          alt=""
          className={`h-3.5 w-3.5 rounded-sm ${config.iconOpacity}`}
          draggable={false}
        />
        <span className={config.compactTextClass}>{config.compactLabel}</span>
      </span>
    );
  }

  // full
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm ${config.fullBorderClass}`}>
      <div className="relative shrink-0">
        <img
          src={CHZZK_ICON_SRC}
          alt="치지직"
          className={`h-10 w-10 rounded-lg ${config.iconOpacity}`}
          draggable={false}
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full ring-2 ring-surface-panel ${config.dotClass}`}
        />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className={`truncate font-semibold ${config.fullLabelClass}`}>치지직 {config.label}</p>
        {config.fullDescription && (
          <p className="truncate text-xs text-content-muted">{config.fullDescription}</p>
        )}
      </div>
      {showCTA && badgeStatus === "not_linked" && onConnectClick && (
        <button
          type="button"
          onClick={onConnectClick}
          className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-content-inverse transition-colors hover:bg-brand-hover"
        >
          연동하기
        </button>
      )}
    </div>
  );
}

const STATUS_CONFIG: Record<BadgeStatus, {
  label: string;
  compactLabel: string;
  iconOpacity: string;
  dotClass: string;
  compactBgClass: string;
  compactTextClass: string;
  fullBorderClass: string;
  fullLabelClass: string;
  fullDescription?: string;
}> = {
  linked: {
    label: "연결됨",
    compactLabel: "연결됨",
    iconOpacity: "opacity-100",
    dotClass: "bg-status-success",
    compactBgClass: "bg-status-success/15",
    compactTextClass: "text-status-success",
    fullBorderClass: "border-status-success/30 bg-status-success/5",
    fullLabelClass: "text-status-success",
  },
  not_linked: {
    label: "미연동",
    compactLabel: "미연동",
    iconOpacity: "opacity-50 grayscale",
    dotClass: "bg-content-muted",
    compactBgClass: "bg-surface-active",
    compactTextClass: "text-content-muted",
    fullBorderClass: "border-border-default bg-surface-raised",
    fullLabelClass: "text-content-primary",
    fullDescription: "방송을 시작하려면 연동이 필요합니다.",
  },
  loading: {
    label: "확인 중",
    compactLabel: "확인 중",
    iconOpacity: "opacity-40 grayscale animate-pulse",
    dotClass: "bg-content-muted/50",
    compactBgClass: "bg-surface-active",
    compactTextClass: "text-content-muted",
    fullBorderClass: "border-border-default bg-surface-raised",
    fullLabelClass: "text-content-muted",
  },
};
