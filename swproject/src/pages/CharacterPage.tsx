/**
 * @file 캐릭터 관리 페이지
 * @migrated Next.js App Router → React Router
 * @change 'use client' 제거
 */

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

export default function CharacterPage() {
  const selectedId = useCharacterStore((s) => s.selectedId);

  const { characters, refetch } = useCharacters();
  const { character } = useCharacter(selectedId);
  const { create } = useCreateCharacter();
  const { update } = useUpdateCharacter();
  const { remove } = useDeleteCharacter();
  const { select } = useSelectCharacter();

  useEffect(() => {
    if (!selectedId && characters.length > 0) {
      void select(characters[0].id);
    }
  }, [selectedId, characters, select]);

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

  const updateCharacter = useCallback(
    async (characterId: string, data: UpdateCharacterRequest) => {
      return update(characterId, data);
    },
    [update]
  );

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
