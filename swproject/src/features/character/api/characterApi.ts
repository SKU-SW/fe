/**
 * @file 캐릭터(Character) CRUD API 호출 함수 모음
 * @created Sprint 1 - Character API 레이어 구현
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/character.ts (CharacterPreset, CreateCharacterRequest, UpdateCharacterRequest, CharacterSettingsResponse)
 * @usedBy src/features/character/hooks/*.ts (모든 character 훅)
 */

import apiClient from '@/shared/lib/axios';
import type {
  CharacterPreset,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CharacterSettingsResponse,
} from '@/shared/types/character';

const CHAR_BASE = '/api/v1/characters';

/**
 * 캐릭터 생성
 * - POST /api/v1/characters
 * - 성공 시 생성된 CharacterPreset 반환
 */
export async function createCharacter(data: CreateCharacterRequest): Promise<CharacterPreset> {
  const res = await apiClient.post<CharacterPreset>(CHAR_BASE, data);
  return res.data;
}

/**
 * 캐릭터 목록 조회
 * - GET /api/v1/characters
 * - 성공 시 CharacterPreset 배열 반환
 */
export async function getCharacters(): Promise<CharacterPreset[]> {
  const res = await apiClient.get<CharacterPreset[]>(CHAR_BASE);
  return res.data;
}

/**
 * 단일 캐릭터 조회
 * - GET /api/v1/characters/:characterId
 * - 성공 시 CharacterPreset 반환
 */
export async function getCharacter(characterId: string): Promise<CharacterPreset> {
  const res = await apiClient.get<CharacterPreset>(`${CHAR_BASE}/${characterId}`);
  return res.data;
}

/**
 * 캐릭터 수정
 * - PUT /api/v1/characters/:characterId
 * - UpdateCharacterRequest는 partial이므로 부분 수정 가능
 * - 성공 시 수정된 CharacterPreset 반환
 */
export async function updateCharacter(
  characterId: string,
  data: UpdateCharacterRequest
): Promise<CharacterPreset> {
  const res = await apiClient.put<CharacterPreset>(`${CHAR_BASE}/${characterId}`, data);
  return res.data;
}

/**
 * 캐릭터 삭제
 * - DELETE /api/v1/characters/:characterId
 * - 성공 시 void 반환
 */
export async function deleteCharacter(characterId: string): Promise<void> {
  await apiClient.delete(`${CHAR_BASE}/${characterId}`);
}

/**
 * 캐릭터 선택 (활성화)
 * - PATCH /api/v1/characters/:characterId
 * - 서버 측에서 해당 캐릭터를 "현재 사용 중"으로 표시
 */
export async function selectCharacter(characterId: string): Promise<void> {
  await apiClient.patch(`${CHAR_BASE}/${characterId}`);
}

/**
 * 캐릭터 설정 옵션 조회
 * - GET /api/v1/characters/settings
 * - 캐릭터 생성/수정 시 선택 가능한 옵션 목록 반환
 *   (성별, 말투, 성격, 페르소나, 외형 프리셋, 음성 프리셋 등)
 */
export async function getCharacterSettings(): Promise<CharacterSettingsResponse> {
  const res = await apiClient.get<CharacterSettingsResponse>(`${CHAR_BASE}/settings`);
  return res.data;
}
