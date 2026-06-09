/**
 * @file 치지직 연동 상태/에러 판별 헬퍼
 * @dependsOn src/shared/types/auth.ts
 * @usedBy src/pages/CharacterPage.tsx
 * @usedBy src/pages/SettingsPage.tsx
 * @usedBy src/features/auth/components/ChzzkStatusBadge.tsx
 * @usedBy src/features/auth/hooks/useChzzkConnect.ts
 */

import type { ChzzkStatusResponse } from "@/shared/types/auth";

export function isChzzkExpired(status: ChzzkStatusResponse | null | undefined): boolean {
  return Boolean(status?.refreshTokenExpired);
}

export function isChzzkReady(status: ChzzkStatusResponse | null | undefined): boolean {
  return Boolean(status?.authorized && !status?.refreshTokenExpired);
}

export function isChzzkLinked(status: ChzzkStatusResponse | null | undefined): boolean {
  return Boolean(status?.authorized);
}

export function isChzzkAuthExpiredMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return message.includes("치지직 인증이 만료") || message.includes("다시 인증해 주세요");
}

export function getChzzkModalMode(status: ChzzkStatusResponse | null | undefined): "connect" | "gate-expired" {
  return isChzzkExpired(status) ? "gate-expired" : "connect";
}
