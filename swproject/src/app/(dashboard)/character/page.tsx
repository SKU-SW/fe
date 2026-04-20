/**
 * @file 캐릭터 관리 페이지
 * @created Sprint 1 - Character 페이지 구현 (UI는 3주차 구현 예정)
 * @dependsOn src/features/character/hooks/*.ts (모든 캐릭터 CRUD 훅)
 * @dependsOn src/shared/stores/characterStore.ts (selectedId)
 *
 * 현재 상태:
 * - 모든 CRUD 훅이 연동되어 있음 (useCharacters, useCharacter, useCreateCharacter, useUpdateCharacter, useDeleteCharacter, useSelectCharacter)
 * - UI는 3주차에 구현 예정
 * - void 변수들로 ESLint 경고 방지 (훅 준비 확인용)
 *
 * 구현된 로직:
 * 1. 페이지 진입 시 캐릭터 목록 자동 조회
 * 2. 선택된 캐릭터가 없으면 첫 번째 캐릭터 자동 선택
 * 3. createCharacter: 생성 후 자동 선택
 * 4. deleteCharacter: 삭제 후 목록 재조회
 */

'use client';

import { useEffect, useCallback } from 'react';
import {
  useCharacters,
  useCharacter,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useSelectCharacter,
} from '@/features/character/hooks';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CreateCharacterRequest, UpdateCharacterRequest } from '@/shared/types/character';

/**
 * 캐릭터 관리 페이지 컴포넌트
 * - 모든 캐릭터 CRUD 훅을 한 곳에서 모아 관리
 * - 3주차에 실제 UI(목록, 생성 폼, 수정 폼 등) 구현 예정
 */
export default function CharacterPage() {
  // 전역 선택 상태
  const selectedId = useCharacterStore((s) => s.selectedId);

  // CRUD 훅 인스턴스
  const { characters, refetch } = useCharacters();
  const { character } = useCharacter(selectedId);
  const { create } = useCreateCharacter();
  const { update } = useUpdateCharacter();
  const { remove } = useDeleteCharacter();
  const { select } = useSelectCharacter();

  // [자동 선택] 선택된 캐릭터가 없으면 첫 번째 캐릭터를 자동 선택
  useEffect(() => {
    if (!selectedId && characters.length > 0) {
      void select(characters[0].id);
    }
  }, [selectedId, characters, select]);

  /**
   * 캐릭터 생성 + 자동 선택
   * - 생성 성공 시 해당 캐릭터를 바로 선택 상태로 만듦
   */
  const createCharacter = useCallback(
    async (data: CreateCharacterRequest) => {
      const created = await create(data);
      if (created) {
        await select(created.id);
      }
      return created;
    },
    [create, select]
  );

  /**
   * 캐릭터 수정 (훅에 위임)
   */
  const updateCharacter = useCallback(
    async (characterId: string, data: UpdateCharacterRequest) => {
      return update(characterId, data);
    },
    [update]
  );

  /**
   * 캐릭터 삭제 + 목록 재조회
   * - 삭제 성공 시 목록을 다시 가져와서 UI 갱신
   */
  const deleteCharacter = useCallback(
    async (characterId: string) => {
      const deleted = await remove(characterId);
      if (deleted) {
        await refetch();
      }
      return deleted;
    },
    [remove, refetch]
  );

  // ESLint 경고 방지 - 훅과 함수가 준비되어 있음을 표시
  void character;
  void createCharacter;
  void updateCharacter;
  void deleteCharacter;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">AI 캐릭터 설정</h1>
      <p className="text-sm text-gray-400">3주차에 구현 예정</p>
    </div>
  );
}
