/**
 * @file 캐릭터 목록/관리 대시보드 화면
 * @created Sprint 3 - Character UI 이식
 * @dependsOn lucide-react, src/shared/types/character.ts (CharacterPreset)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { CheckCircle2, Circle, Edit2, Eye, Plus, Trash2, Zap } from "lucide-react";
import type { CharacterPreset } from "@/shared/types/character";

interface CharacterDashboardProps {
  characters: CharacterPreset[];
  selectedId: string | null;
  isSelecting?: boolean;
  isDeleting?: boolean;
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onSelectClick: (id: string) => void;
}

function getPersonaLabel(persona?: string): string {
  if (persona === "game_specialist") return "게임 특화";
  if (persona === "humor_entertainment") return "유머/예능";
  if (persona === "focused_serious") return "진중/집중";
  if (persona === "chat_social") return "잡담/소통";
  return "지정 안 됨";
}

export function CharacterDashboard({
  characters,
  selectedId,
  isSelecting = false,
  isDeleting = false,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onSelectClick,
}: CharacterDashboardProps) {
  const selectedChar = characters.find((character) => character.id === selectedId) ?? characters[0];

  return (
    <div className="h-full bg-slate-950 p-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">내 AI 캐릭터</h2>
            <p className="text-sm text-slate-400">보유한 AI 동료를 확인하고 관리하세요.</p>
          </div>
        </div>

        {selectedChar && (
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-slate-200">
              <CheckCircle2 className="h-5 w-5 text-indigo-300" />
              현재 선택된 AI 캐릭터 정보
            </h3>
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 md:flex-row">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-2xl font-bold text-slate-300">
                {selectedChar.name.charAt(0)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-bold text-white">{selectedChar.name}</h4>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                    {selectedChar.info.gender === "female" ? "여성" : "남성"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Zap className="h-4 w-4 text-indigo-300" />
                  {getPersonaLabel(selectedChar.info.persona)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-200">생성한 AI 캐릭터 ({characters.length})</h3>
            <button
              type="button"
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              AI 캐릭터 생성하기
            </button>
          </div>

          <div className="space-y-3">
            {characters.map((character) => {
              const isSelected = selectedId === character.id;
              return (
                <div
                  key={character.id}
                  className={`flex flex-col gap-4 rounded-xl border p-5 transition sm:flex-row sm:items-center ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-slate-700 bg-slate-900 hover:border-slate-600"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                      {character.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">{character.name}</p>
                      <p className="text-xs text-slate-400">{getPersonaLabel(character.info.persona)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSelecting}
                      onClick={() => onSelectClick(character.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/20 text-blue-300"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      {isSelected ? "선택됨" : "선택"}
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
                      title="상세"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditClick(character.id)}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
                      title="수정"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        if (window.confirm("이 캐릭터를 삭제하시겠습니까?")) {
                          onDeleteClick(character.id);
                        }
                      }}
                      className="rounded-lg border border-red-900/40 bg-red-950/30 p-2 text-red-300 hover:bg-red-900/50 disabled:opacity-60"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
