/**
 * @file 방송 진입/대화 페이징 API + DTO ↔ FE 모델 adapter
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/broadcast.ts (Swagger DTO)
 * @dependsOn src/shared/types/stream.ts (FE 내부 모델)
 * @usedBy src/features/broadcast/hooks/useStreamInfo.ts
 *
 * Backend Swagger:
 *   - GET /api/v1/stream/info?size=N
 *   - GET /api/v1/stream/info/dialogues?size&cursorId&aiCharacterDialogue&streamerDialogue&viewerDialogue
 */

import apiClient from "@/shared/lib/axios";
import type {
  BroadcastDialogueCursorItemResDto,
  CurrentStreamInfoResDto,
  CursorSliceResponse,
  DialogueSubject,
  GetStreamDialoguesParams,
} from "@/shared/types/broadcast";
import type { DialogueSpeaker, StreamDialogue } from "@/shared/types/stream";

const STREAM_BASE = "/api/v1/stream";

// ============================================================
// API 호출
// ============================================================

/**
 * GET /api/v1/stream/info
 * - 대시보드 진입 시 1회 호출. 진행 중 방송이 없으면 404.
 * - 200: 캐릭터 정보 + 최신 대화 N개 + nextCursor
 * - 응답의 content 는 BE 가 정렬해 보내주지만 FE 측 정렬도 안전망으로 유지
 */
export async function getStreamInfo(size = 30): Promise<CurrentStreamInfoResDto> {
  const safeSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 1;
  const res = await apiClient.get<CurrentStreamInfoResDto>(`${STREAM_BASE}/info`, {
    params: { size: safeSize },
  });
  return res.data;
}

/**
 * GET /api/v1/stream/info/dialogues
 * - 무한 스크롤용. cursorId 이하의 대화를 size 개 가져옴.
 * - 4가지 subject 중 무엇을 포함할지 boolean 으로 선택.
 */
export async function getStreamDialoguesByCursor(
  params: GetStreamDialoguesParams
): Promise<CursorSliceResponse<BroadcastDialogueCursorItemResDto>> {
  const res = await apiClient.get<CursorSliceResponse<BroadcastDialogueCursorItemResDto>>(
    `${STREAM_BASE}/info/dialogues`,
    { params }
  );
  return res.data;
}

// ============================================================
// DTO → FE 모델 어댑터
// ============================================================

const SUBJECT_TO_SPEAKER: Record<DialogueSubject, DialogueSpeaker> = {
  STREAMER: "streamer",
  AI_CHARACTER: "ai",
  VIEWER: "viewer",
  SYSTEM_SUMMARY: "system",
};

/** Swagger DialogueItem → FE StreamDialogue */
export function adaptDialogue(
  dto: BroadcastDialogueCursorItemResDto
): StreamDialogue {
  return {
    id: String(dto.cursorId),
    cursorId: dto.cursorId,
    speaker: SUBJECT_TO_SPEAKER[dto.subject],
    text: dto.content,
    emotion: "default",
    timestamp: dto.createdAt,
  };
}
