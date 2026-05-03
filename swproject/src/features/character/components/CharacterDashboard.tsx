/**
 * @file 캐릭터 목록/관리 대시보드 화면
 * @created Sprint 3 - Character UI 이식
 * @updated Enhanced with polished UI/UX design
 * @updated Sprint 4 - 방송 시작/종료 버튼(카드 우측), LIVE 뱃지, 캐릭터 10개 한도
 * @dependsOn lucide-react, src/shared/types/character.ts (CharacterPreset)
 * @dependsOn src/shared/constants/character.ts (MAX_CHARACTERS_PER_USER)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { CheckCircle2, Circle, Edit2, Plus, Radio, Square, Trash2, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import type { CharacterPreset } from "@/shared/types/character";
import { resolveAssetUrl } from "@/shared/lib/utils";
import { MAX_CHARACTERS_PER_USER } from "@/shared/constants/character";

interface CharacterDashboardProps {
  characters: CharacterPreset[];
  selectedId: string | null;
  isSelecting?: boolean;
  isDeleting?: boolean;
  isLoading?: boolean;
  error?: string | null;
  /** 현재 방송 중인 캐릭터 ID (없으면 idle 상태) */
  broadcastingId?: string | null;
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onSelectClick: (id: string) => void;
  onBroadcastClick?: (id: string) => void;
  onStopBroadcastClick?: (id: string) => void;
}

/**
 * 페르소나를 한글 레이블로 변환 (BroadcastPreset 5개와 1:1 매칭)
 */
function getPersonaLabel(persona?: string): string {
  const labels: Record<string, string> = {
    neighbor: "동네 친구",
    high_tension: "텐션 폭발",
    teaser: "깐족 요정",
    manager: "전문 매니저",
    immersive: "과몰입 장인",
  };
  return labels[persona || ""] || "지정 안 됨";
}

/**
 * 페르소나 아이콘 색상
 */
function getPersonaColor(persona?: string): string {
  const colors: Record<string, string> = {
    neighbor: "text-emerald-400",
    high_tension: "text-pink-400",
    teaser: "text-purple-400",
    manager: "text-indigo-400",
    immersive: "text-amber-400",
  };
  return colors[persona || ""] || "text-slate-400";
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
      <div className="h-40 rounded-xl bg-slate-800" />
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
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
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
  broadcastingId = null,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onSelectClick,
  onBroadcastClick,
  onStopBroadcastClick,
}: CharacterDashboardProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const selectedChar = characters.find((character) => character.id === selectedId) ?? characters[0];
  const hasCharacters = characters.length > 0;
  // 상단 카드(featured)에 표시 중인 캐릭터가 곧 방송 중인지 여부
  // - LIVE 뱃지/빨간 테두리/방송 종료 버튼 등 UI 분기에 사용
  const isFeaturedBroadcasting = !!selectedChar && broadcastingId === selectedChar.id;
  // 한 계정당 캐릭터 최대 수 도달 여부 (생성 버튼 비활성화 조건)
  const isAtMaxCharacters = characters.length >= MAX_CHARACTERS_PER_USER;

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
              {isFeaturedBroadcasting ? (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300 border border-red-500/30">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                    LIVE
                  </span>
                  현재 방송 중인 AI 캐릭터 정보
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                  현재 선택된 AI 캐릭터 정보
                </>
              )}
            </h2>

            <div
              className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-8 transition-all hover:shadow-lg ${
                isFeaturedBroadcasting
                  ? "border-red-500/40 from-slate-800 to-slate-900 hover:border-red-500/60 hover:shadow-red-500/10"
                  : "border-slate-700/50 from-slate-800 to-slate-900 hover:border-slate-600/50 hover:shadow-indigo-500/10"
              }`}
            >
              {/* Decorative gradient background */}
              <div
                className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                  isFeaturedBroadcasting
                    ? "bg-gradient-to-br from-red-600/5 to-transparent"
                    : "bg-gradient-to-br from-indigo-600/5 to-transparent"
                }`}
              />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="flex shrink-0">
                    <FeaturedAvatar
                      imageUrl={selectedChar.info.imageUrl}
                      fallbackChar={selectedChar.name.charAt(0).toUpperCase()}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-5">
                    {/* Name */}
                    <h3 className="text-2xl font-bold text-white">{selectedChar.name}</h3>

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
                  </div>
                </div>

                {/* Broadcast Button (오른쪽 정렬) */}
                {(onBroadcastClick || onStopBroadcastClick) && (
                  <div className="shrink-0 sm:self-center">
                    {isFeaturedBroadcasting && onStopBroadcastClick ? (
                      <button
                        type="button"
                        onClick={() => onStopBroadcastClick(selectedChar.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-red-500/30 active:scale-95"
                      >
                        <Square className="h-4 w-4 fill-current" />
                        이 캐릭터의 방송 종료
                      </button>
                    ) : (
                      onBroadcastClick && (
                        <button
                          type="button"
                          onClick={() => onBroadcastClick(selectedChar.id)}
                          disabled={!!broadcastingId}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                          title={broadcastingId ? "다른 캐릭터가 방송 중입니다" : undefined}
                        >
                          <Radio className="h-4 w-4" />
                          이 캐릭터로 방송 시작
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Character List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">
              생성한 AI 캐릭터{" "}
              <span className={isAtMaxCharacters ? "text-amber-400" : "text-slate-400"}>
                ({characters.length} / {MAX_CHARACTERS_PER_USER})
              </span>
            </h2>
            <button
              type="button"
              onClick={onCreateClick}
              disabled={isAtMaxCharacters}
              title={isAtMaxCharacters ? `최대 ${MAX_CHARACTERS_PER_USER}개까지 생성 가능합니다` : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              AI 캐릭터 생성하기
            </button>
          </div>

          {isAtMaxCharacters && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
              <span className="text-amber-400">ⓘ</span>
              <span>
                한 계정당 AI 캐릭터는 최대 <strong>{MAX_CHARACTERS_PER_USER}개</strong>까지 생성할 수 있습니다.
                새로 만들려면 기존 캐릭터를 먼저 삭제해주세요.
              </span>
            </div>
          )}

          {!isLoading && !hasCharacters ? (
            <EmptyState onCreateClick={onCreateClick} />
          ) : (
            <div className="space-y-3">
              {characters.map((character) => {
                const isSelected = selectedId === character.id;
                const isBroadcastingThis = broadcastingId === character.id;
                const callWords = character.info.callSign
                  .split(",")
                  .map((w) => w.trim())
                  .filter(Boolean);

                return (
                  <div
                    key={character.id}
                    className={`group relative overflow-hidden rounded-xl border transition-all ${
                      isBroadcastingThis
                        ? "border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/10"
                        : isSelected
                          ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                          : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/50 hover:bg-slate-800/60"
                    }`}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/0 to-indigo-600/0 opacity-0 transition-opacity group-hover:opacity-5" />

                    <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
                      {/* Avatar & Info */}
                      <div className="flex items-start gap-4 sm:items-center">
                        <ListAvatar
                          imageUrl={character.info.imageUrl}
                          fallbackChar={character.name.charAt(0).toUpperCase()}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{character.name}</p>
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
                        {isBroadcastingThis ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-300">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                            방송 중
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isSelecting || !!broadcastingId}
                            onClick={() => onSelectClick(character.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              isSelected
                                ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                                : "border-slate-600/50 bg-slate-700/50 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={broadcastingId ? "방송 중에는 다른 캐릭터를 선택할 수 없습니다" : undefined}
                          >
                            {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">{isSelected ? "선택됨" : "선택"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBroadcastingThis}
                          onClick={() => onEditClick(character.id)}
                          className="rounded-lg border border-slate-600/50 bg-slate-700/50 p-1.5 text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          title={isBroadcastingThis ? "방송 중에는 수정할 수 없습니다" : "수정"}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        {pendingDeleteId === character.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => {
                                onDeleteClick(character.id);
                                setPendingDeleteId(null);
                              }}
                              className="rounded-lg border border-red-500/40 bg-red-500/15 px-2 py-1 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              삭제 확인
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setPendingDeleteId(null)}
                              className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isDeleting || isBroadcastingThis}
                            onClick={() => setPendingDeleteId(character.id)}
                            className="rounded-lg border border-red-900/30 bg-red-950/20 p-1.5 text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                            title={isBroadcastingThis ? "방송 중에는 삭제할 수 없습니다" : "삭제"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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

/** 선택된 캐릭터 큰 아바타 (128x128) */
function FeaturedAvatar({ imageUrl, fallbackChar }: { imageUrl?: string; fallbackChar: string }) {
  const resolved = resolveAssetUrl(imageUrl);
  if (resolved) {
    return (
      <div className="h-32 w-32 overflow-hidden rounded-xl border border-slate-600/50 bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg">
        <img
          src={resolved}
          alt="character"
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement?.classList.add("flex", "items-center", "justify-center", "text-4xl", "font-bold", "text-slate-300");
            const fallback = document.createElement("span");
            fallback.textContent = fallbackChar;
            target.parentElement?.appendChild(fallback);
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-slate-600/50 bg-gradient-to-br from-slate-700 to-slate-800 text-4xl font-bold text-slate-300 shadow-lg">
      {fallbackChar}
    </div>
  );
}

/** 목록용 작은 아바타 (48x48) */
function ListAvatar({ imageUrl, fallbackChar }: { imageUrl?: string; fallbackChar: string }) {
  const resolved = resolveAssetUrl(imageUrl);
  if (resolved) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-600/50 bg-slate-700">
        <img
          src={resolved}
          alt="character"
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement?.classList.add("flex", "items-center", "justify-center", "text-sm", "font-bold", "text-slate-300");
            const fallback = document.createElement("span");
            fallback.textContent = fallbackChar;
            target.parentElement?.appendChild(fallback);
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-700 text-sm font-bold text-slate-300">
      {fallbackChar}
    </div>
  );
}
