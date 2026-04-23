/**
 * @file 캐릭터 목록/관리 대시보드 화면
 * @created Sprint 3 - Character UI 이식
 * @updated Enhanced with polished UI/UX design
 * @dependsOn lucide-react, src/shared/types/character.ts (CharacterPreset)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { CheckCircle2, Circle, Edit2, Eye, Plus, Trash2, Zap, Sparkles } from "lucide-react";
import type { CharacterPreset } from "@/shared/types/character";

interface CharacterDashboardProps {
  characters: CharacterPreset[];
  selectedId: string | null;
  isSelecting?: boolean;
  isDeleting?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onSelectClick: (id: string) => void;
  onBroadcastClick?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

/**
 * 페르소나를 한글 레이블로 변환
 */
function getPersonaLabel(persona?: string): string {
  const labels: Record<string, string> = {
    game_specialist: "게임 특화",
    humor_entertainment: "유머/예능",
    focused_serious: "진중/집중",
    chat_social: "잡담/소통",
  };
  return labels[persona || ""] || "지정 안 됨";
}

/**
 * 페르소나 아이콘 색상
 */
function getPersonaColor(persona?: string): string {
  const colors: Record<string, string> = {
    game_specialist: "text-purple-400",
    humor_entertainment: "text-pink-400",
    focused_serious: "text-blue-400",
    chat_social: "text-emerald-400",
  };
  return colors[persona || ""] || "text-slate-400";
}

/**
 * 성별 배지 렌더링
 */
function GenderBadge({ gender }: { gender: string }) {
  const isFemalse = gender === "female";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-200">
      {isFemalse ? "👩 여성" : "👨 남성"}
    </span>
  );
}

/**
 * 호출어 배지 렌더링
 */
function CallWordBadges({ callWords }: { callWords: string[] }) {
  if (!callWords.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {callWords.map((word) => (
        <span
          key={word}
          className="inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30"
        >
          "{word}"
        </span>
      ))}
    </div>
  );
}

/**
 * 로딩 스켈레톤
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 rounded-2xl bg-slate-800" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

/**
 * 에러 상태
 */
function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-300">{error}</p>
    </div>
  );
}

/**
 * 빈 상태
 */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-indigo-500/10 p-4">
          <Sparkles className="h-8 w-8 text-indigo-400" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">아직 생성된 캐릭터가 없습니다</h3>
      <p className="mb-6 text-sm text-slate-400">
        방송을 함께할 AI 동료를 만들어보세요. 외모, 목소리, 페르소나를 조합해 캐릭터를 구성할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        첫 캐릭터 생성하기
      </button>
    </div>
  );
}

export function CharacterDashboard({
  characters,
  selectedId,
  isSelecting = false,
  isDeleting = false,
  isLoading = false,
  error = null,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onSelectClick,
  onBroadcastClick,
  onViewDetails,
}: CharacterDashboardProps) {
  const selectedChar = characters.find((character) => character.id === selectedId) ?? characters[0];
  const hasCharacters = characters.length > 0;

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">내 AI 캐릭터</h1>
          <p className="text-sm text-slate-400">보유한 AI 동료를 확인하고 관리하세요</p>
        </div>

        {/* Error State */}
        {error && <ErrorState error={error} />}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Featured Character Section */}
        {!isLoading && hasCharacters && selectedChar && (
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
              <CheckCircle2 className="h-5 w-5 text-indigo-400" />
              현재 선택된 AI 캐릭터 정보
            </h2>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-indigo-500/10">
              {/* Decorative gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start">
                {/* Avatar */}
                <div className="flex shrink-0">
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-700 to-slate-800 text-4xl font-bold text-slate-300 shadow-lg">
                    {selectedChar.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-5">
                  {/* Name & Gender */}
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-bold text-white">{selectedChar.name}</h3>
                    <GenderBadge gender={selectedChar.info.gender} />
                  </div>

                  {/* Persona */}
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${getPersonaColor(selectedChar.info.persona)}`} />
                    <span className="text-sm font-medium text-slate-300">
                      페르소나: <span className="text-white">{getPersonaLabel(selectedChar.info.persona)}</span>
                    </span>
                  </div>

                  {/* Call Words */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-400">호출어</p>
                    <CallWordBadges callWords={selectedChar.info.callSign.split(",").map((w) => w.trim()).filter(Boolean)} />
                  </div>

                  {/* Broadcast Button */}
                  {onBroadcastClick && (
                    <button
                      type="button"
                      onClick={() => onBroadcastClick(selectedChar.id)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                    >
                      <Zap className="h-4 w-4" />
                      이 캐릭터로 방송 시작
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Character List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">
              생성한 AI 캐릭터 <span className="text-slate-400">({characters.length})</span>
            </h2>
            <button
              type="button"
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              AI 캐릭터 생성하기
            </button>
          </div>

          {!isLoading && !hasCharacters ? (
            <EmptyState onCreateClick={onCreateClick} />
          ) : (
            <div className="space-y-3">
              {characters.map((character) => {
                const isSelected = selectedId === character.id;
                const callWords = character.info.callSign
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean);

                return (
                  <div
                    key={character.id}
                    className={`group relative overflow-hidden rounded-xl border transition-all ${
                      isSelected
                        ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                        : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/50 hover:bg-slate-800/60"
                    }`}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/0 to-indigo-600/0 opacity-0 transition-opacity group-hover:opacity-5" />

                    <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
                      {/* Avatar & Info */}
                      <div className="flex items-start gap-4 sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-700 text-sm font-bold text-slate-300">
                          {character.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">{character.name}</p>
                            <GenderBadge gender={character.info.gender} />
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            <span className={`font-medium ${getPersonaColor(character.info.persona)}`}>
                              [{getPersonaLabel(character.info.persona)}]
                            </span>
                            {callWords.length > 0 && (
                              <> • 호출어: {callWords.slice(0, 2).join(", ")}{callWords.length > 2 ? "..." : ""}</>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          disabled={isSelecting}
                          onClick={() => onSelectClick(character.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                              : "border-slate-600/50 bg-slate-700/50 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700"
                          } disabled:opacity-50`}
                        >
                          {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{isSelected ? "선택됨" : "선택"}</span>
                        </button>

                        {onViewDetails && (
                          <button
                            type="button"
                            onClick={() => onViewDetails(character.id)}
                            className="rounded-lg border border-slate-600/50 bg-slate-700/50 p-1.5 text-slate-300 transition hover:bg-slate-700"
                            title="상세 정보"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onEditClick(character.id)}
                          className="rounded-lg border border-slate-600/50 bg-slate-700/50 p-1.5 text-slate-300 transition hover:bg-slate-700"
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
                          className="rounded-lg border border-red-900/30 bg-red-950/20 p-1.5 text-red-400 transition hover:bg-red-950/40 disabled:opacity-50"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
    </div>
  );
}
