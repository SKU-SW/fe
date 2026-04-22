/**
 * @file 캐릭터(Character) CRUD API 호출 함수 모음
 * @created Sprint 1 - Character API 레이어 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/character.ts (CharacterDetailResDto, CharacterListItemResDto, CharacterCreateReqDto, CharacterUpdateReqDto, CharacterSelectReqDto, CharacterSelectResDto, CharacterSettingsResDto, SliceResponse)
 * @usedBy src/features/character/hooks/*.ts (모든 character 훅)
 */

import apiClient from '@/shared/lib/axios';
import type {
  CharacterDetailResDto,
  CharacterListItemResDto,
  CharacterCreateReqDto,
  CharacterUpdateReqDto,
  CharacterSelectReqDto,
  CharacterSelectResDto,
  CharacterSettingsResDto,
  SliceResponse,
} from '@/shared/types/character';

const CHAR_BASE = '/api/v1/characters';

/**
 * 캐릭터 생성
 * - POST /api/v1/characters
 * - 요청: CharacterCreateReqDto
 * - 성공 시 CharacterDetailResDto 반환
 */
export async function createCharacter(data: CharacterCreateReqDto): Promise<CharacterDetailResDto> {
  const res = await apiClient.post<CharacterDetailResDto>(CHAR_BASE, data);
  return res.data;
}

/**
 * 캐릭터 목록 조회
 * - GET /api/v1/characters
 * - 성공 시 SliceResponse<CharacterListItemResDto> 반환
 */
export async function getCharacters(): Promise<SliceResponse<CharacterListItemResDto>> {
  const res = await apiClient.get<SliceResponse<CharacterListItemResDto>>(CHAR_BASE);
  return res.data;
}

/**
 * 단일 캐릭터 조회
 * - GET /api/v1/characters/:characterId
 * - 성공 시 CharacterDetailResDto 반환
 */
export async function getCharacter(characterId: number): Promise<CharacterDetailResDto> {
  const res = await apiClient.get<CharacterDetailResDto>(`${CHAR_BASE}/${characterId}`);
  return res.data;
}

/**
 * 캐릭터 수정
 * - PUT /api/v1/characters/:characterId
 * - 요청: CharacterUpdateReqDto (모든 필드 필수)
 * - 성공 시 CharacterDetailResDto 반환
 */
export async function updateCharacter(
  characterId: number,
  data: CharacterUpdateReqDto
): Promise<CharacterDetailResDto> {
  const res = await apiClient.put<CharacterDetailResDto>(`${CHAR_BASE}/${characterId}`, data);
  return res.data;
}

/**
 * 캐릭터 삭제
 * - DELETE /api/v1/characters/:characterId
 * - 성공 시 void 반환
 */
export async function deleteCharacter(characterId: number): Promise<void> {
  await apiClient.delete(`${CHAR_BASE}/${characterId}`);
}

/**
 * 캐릭터 선택/해제
 * - PATCH /api/v1/characters/:characterId
 * - 요청 바디: { isSelected: boolean }
 * - 성공 시 CharacterSelectResDto 반환
 */
export async function selectCharacter(
  characterId: number,
  data: CharacterSelectReqDto
): Promise<CharacterSelectResDto> {
  const res = await apiClient.patch<CharacterSelectResDto>(`${CHAR_BASE}/${characterId}`, data);
  return res.data;
}

/**
 * 캐릭터 설정 옵션 조회
 * - GET /api/v1/characters/settings
 * - 캐릭터 생성/수정 시 선택 가능한 옵션 목록 반환
 *   (음성 타입, 캐릭터 이미지, 프리셋 타입, 말투 스타일, 성격 타입)
 */
export async function getCharacterSettings(): Promise<CharacterSettingsResDto> {
  const res = await apiClient.get<CharacterSettingsResDto>(`${CHAR_BASE}/settings`);
  return res.data;
}
