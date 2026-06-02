/**
 * @file 캐릭터 관련 상수
 * @created Sprint 4 - 캐릭터 생성 한도 도입
 * @usedBy src/features/character/components/CharacterDashboard.tsx
 * @usedBy src/pages/CharacterPage.tsx
 */

/**
 * 한 계정당 생성 가능한 AI 캐릭터 최대 수
 * - 백엔드 `GET /api/v1/characters` 의 기본 page size(10)과 정렬을 맞추기 위해 10으로 설정
 * - 백엔드에서 강제하지 않으므로 프론트에서 방어적으로 제한
 */
export const MAX_CHARACTERS_PER_USER = 10;

/**
 * 페르소나 + 성별 → TTS 음성 이름 매핑
 * - presets 5개에 대해 남성/여성 음성 이름을 정의
 * - custom은 제외 (매핑하지 않음)
 */
export const PERSONA_VOICE_MAP: Record<string, { male: string; female: string }> = {
  neighbor: { male: "Zubenelgenubi", female: "Sulafat" },
  high_tension: { male: "Sadachbia", female: "Fenrir" },
  teaser: { male: "Puck", female: "Zephyr" },
  manager: { male: "Charon", female: "Erinome" },
  immersive: { male: "Algenib", female: "Gacrux" },
};
