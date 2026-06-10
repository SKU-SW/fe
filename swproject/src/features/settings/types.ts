/**
 * @file 방송 설정 DTO 타입 — /api/v1/broadcast/settings
 * @usedBy src/features/settings/api/broadcastSettingsApi.ts
 * @usedBy src/features/settings/hooks/useBroadcastSettings.ts
 */

/** GET / PATCH 응답 — 현재 방송 설정 값 */
export interface BroadcastSettingResDto {
  /** AI가 채팅에 선제 반응할지 여부 */
  aiProactiveToChat: boolean;
}

/** PATCH /ai-proactive 요청 */
export interface AiProactiveUpdateReqDto {
  aiProactiveToChat: boolean;
}
