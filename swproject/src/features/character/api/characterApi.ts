/**
 * @file 캐릭터(Character) CRUD API 호출 함수 모음
 * @created Sprint 1 - Character API 레이어 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/character.ts (CharacterDetailResDto, CharacterListItemResDto, CharacterCreateReqDto, CharacterUpdateReqDto, CharacterSelectReqDto, CharacterSelectResDto, CharacterSettingsResDto, SliceResponse)
 * @usedBy src/features/character/hooks/*.ts (모든 character 훅)
 */

import apiClient from '@/shared/lib/axios';
import { useCharacterAppearanceStore } from '@/shared/stores/characterAppearanceStore';
import {
  fromBackendAppearance,
  type CharacterDetailResDto,
  type CharacterListItemResDto,
  type CharacterCreateReqDto,
  type CharacterUpdateReqDto,
  type CharacterSelectReqDto,
  type CharacterSelectResDto,
  type CharacterSettingsResDto,
  type SliceResponse,
  type VrmPresetResDto,
} from '@/shared/types/character';

const CHAR_BASE = '/api/v1/characters';
const IS_DEV = import.meta.env.DEV;

// ============================================================
// 응답 어댑터 — 백엔드 raw → 프론트 친화 형태
// ============================================================

function adaptCharacterDetail(raw: CharacterDetailResDto): CharacterDetailResDto {
  const appearance = raw.characterAppearanceType;
  if (appearance) {
    return {
      ...raw,
      modelType: fromBackendAppearance(appearance),
    };
  }
  const fallback = useCharacterAppearanceStore.getState().getAppearance(raw.characterId);
  if (fallback) {
    return {
      ...raw,
      modelType: fallback.modelType,
      characterAppearanceType: fallback.modelType === '3D' ? 'THREE_D' : 'TWO_D',
      characterImageId: fallback.modelType === '2D' ? fallback.targetId : null,
      vrmPresetId: fallback.modelType === '3D' ? fallback.targetId : null,
      vrmUrl: fallback.vrmUrl ?? null,
      vrmThumbnailUrl: fallback.vrmThumbnailUrl ?? null,
    };
  }
  return {
    ...raw,
    modelType: raw.modelType ?? '2D',
  };
}

function adaptCharacterListItem(raw: CharacterListItemResDto): CharacterListItemResDto {
  const appearance = raw.characterAppearanceType;
  if (appearance) {
    return {
      ...raw,
      modelType: fromBackendAppearance(appearance),
    };
  }
  const fallback = useCharacterAppearanceStore.getState().getAppearance(raw.characterId);
  if (fallback) {
    return {
      ...raw,
      modelType: fallback.modelType,
      characterAppearanceType: fallback.modelType === '3D' ? 'THREE_D' : 'TWO_D',
      characterImageId: fallback.modelType === '2D' ? fallback.targetId : null,
      vrmPresetId: fallback.modelType === '3D' ? fallback.targetId : null,
      vrmUrl: fallback.vrmUrl ?? null,
      vrmThumbnailUrl: fallback.vrmThumbnailUrl ?? null,
    };
  }
  return {
    ...raw,
    modelType: raw.modelType ?? '2D',
  };
}

function adaptVrmPreset(raw: VrmPresetResDto): VrmPresetResDto {
  return {
    ...raw,
    presetId: raw.presetId ?? raw.characterVrmId,
  };
}

function adaptSettings(raw: CharacterSettingsResDto): CharacterSettingsResDto {
  const vrmPresets = raw.vrmPresets?.map(adaptVrmPreset);
  return {
    ...raw,
    vrmPresets,
    presetTypes: raw.personaPresetTypes ?? raw.presetTypes,
    availableModelTypes: (vrmPresets ?? []).length > 0 ? ['2D', '3D'] : ['2D'],
  };
}

/**
 * 캐릭터 생성
 * - POST /api/v1/characters
 * - 요청: CharacterCreateReqDto
 * - 성공 시 CharacterDetailResDto 반환
 */
export async function createCharacter(data: CharacterCreateReqDto): Promise<CharacterDetailResDto> {
  const res = await apiClient.post<CharacterDetailResDto>(CHAR_BASE, data);
  return adaptCharacterDetail(res.data);
}

/**
 * 캐릭터 목록 조회
 * - GET /api/v1/characters?page={page}&size={size}
 * - 요청: page (1-indexed), size (items per page)
 * - 성공 시 SliceResponse<CharacterListItemResDto> 반환
 */
export async function getCharacters(page: number = 1, size: number = 10): Promise<SliceResponse<CharacterListItemResDto>> {
  const res = await apiClient.get<SliceResponse<CharacterListItemResDto>>(CHAR_BASE, {
    params: { page, size }
  });
  if (IS_DEV) {
    console.log('[characterApi] GET /characters response:', {
      page,
      size,
      items: res.data.content.map((item) => ({
        characterId: item.characterId,
        characterName: item.characterName,
        characterPersona: item.characterPersona ?? null,
      }))
    });
  }
  return {
    ...res.data,
    content: res.data.content.map(adaptCharacterListItem),
  };
}

/**
 * 단일 캐릭터 조회
 * - GET /api/v1/characters/:characterId
 * - 성공 시 CharacterDetailResDto 반환
 */
export async function getCharacter(characterId: number): Promise<CharacterDetailResDto> {
  const res = await apiClient.get<CharacterDetailResDto>(`${CHAR_BASE}/${characterId}`);
  if (IS_DEV) {
    console.log('[characterApi] GET /characters/:id response:', {
      characterId: res.data.characterId,
      characterName: res.data.characterName,
      characterPersona: res.data.characterPersona,
    });
  }
  return adaptCharacterDetail(res.data);
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
  if (IS_DEV) {
    console.log('[characterApi] PUT /characters/:id payload:', {
      characterId,
      characterName: data.characterName,
      triggerWords: data.triggerWords,
      characterPersona: data.characterPersona,
    });
  }
  const res = await apiClient.put<CharacterDetailResDto>(`${CHAR_BASE}/${characterId}`, data);
  if (IS_DEV) {
    console.log('[characterApi] PUT /characters/:id success:', {
      characterId: res.data.characterId,
      characterName: res.data.characterName,
      characterPersona: res.data.characterPersona,
    });
  }
  return adaptCharacterDetail(res.data);
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
  return adaptSettings(res.data);
}
