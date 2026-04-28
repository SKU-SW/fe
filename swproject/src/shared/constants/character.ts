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
