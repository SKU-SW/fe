/**
 * @file 방송 설정 REST API — AI 선제 반응 / 초기화
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @usedBy src/features/settings/hooks/useBroadcastSettings.ts
 *
 * Backend:
 *   GET   /api/v1/broadcast/settings                → BroadcastSettingResDto
 *     404 → 설정 미존재 (init 호출로 생성 가능)
 *   PATCH /api/v1/broadcast/settings/ai-proactive   → BroadcastSettingResDto (멱등)
 *   PATCH /api/v1/broadcast/settings/init           → BroadcastSettingResDto (기본값 복원)
 */

import apiClient from "@/shared/lib/axios";
import type {
  BroadcastSettingResDto,
  AiProactiveUpdateReqDto,
} from "@/features/settings/types";

const BASE = "/api/v1/broadcast/settings";

export async function getBroadcastSettings(): Promise<BroadcastSettingResDto> {
  const res = await apiClient.get<BroadcastSettingResDto>(BASE);
  return res.data;
}

export async function updateAiProactive(
  value: boolean,
): Promise<BroadcastSettingResDto> {
  const body: AiProactiveUpdateReqDto = { aiProactiveToChat: value };
  const res = await apiClient.patch<BroadcastSettingResDto>(`${BASE}/ai-proactive`, body);
  return res.data;
}

export async function initBroadcastSettings(): Promise<BroadcastSettingResDto> {
  const res = await apiClient.patch<BroadcastSettingResDto>(`${BASE}/init`);
  return res.data;
}
