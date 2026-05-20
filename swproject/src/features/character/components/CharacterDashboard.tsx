/**
 * @file 캐릭터 목록/관리 대시보드 화면
 * @updated 시맨틱 테마 토큰 기반으로 스타일 정리
 * @dependsOn lucide-react, src/shared/types/character.ts (CharacterPreset)
 * @dependsOn src/shared/constants/character.ts (MAX_CHARACTERS_PER_USER)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { CheckCircle2, Circle, Edit2, Info, Plus, Radio, Sparkles, Square, Trash2 } from "lucide-react";
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

// ============================================================
// 페르소나 표시 헬퍼
// ============================================================

const PERSONA_LABEL: Record<string, string> = {
  neighbor: "동네 친구",
  high_tension: "텐션 폭발",
  teaser: "깐족 요정",
  manager: "전문 매니저",
  immersive: "과몰입 장인",
  custom: "커스텀",
};

const PERSONA_COLOR: Record<string, string> = {
  neighbor: "text-status-success",
  high_tension: "text-status-warning",
  teaser: "text-brand",
  manager: "text-content-secondary",
  immersive: "text-brand",
  custom: "text-status-warning",
};

function getSafeCharacterName(name: string | undefined | null): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed || "AI";
}

function getFallbackChar(name: string | undefined | null): string {
  return getSafeCharacterName(name).charAt(0).toUpperCase();
}

function getPersonaLabel(persona?: string): string {
  return PERSONA_LABEL[persona ?? ""] ?? "지정 안 됨";
}

function getPersonaColor(persona?: string): string {
  return PERSONA_COLOR[persona ?? ""] ?? "text-content-muted";
}

// ============================================================
// 보조 UI
// ============================================================

function CallWordBadges({ callWords }: { callWords: string[] }) {
  if (!callWords.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {callWords.map((word) => (
        <span
          key={word}
          className="inline-flex items-center rounded-full border border-brand/30 bg-brand/15 px-3 py-1 text-xs font-medium text-brand"
        >
          "{word}"
        </span>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 rounded-lg border border-border-default bg-surface-panel" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-border-default bg-surface-panel" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-6 text-center">
      <p className="text-sm text-status-danger">{error}</p>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-lg border border-border-strong bg-surface-panel p-12 text-center transition-colors">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full border border-brand/30 bg-brand/10 p-4">
          <Sparkles className="h-8 w-8 text-brand" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-content-primary">아직 생성된 캐릭터가 없습니다</h3>
      <p className="mb-6 text-sm text-content-muted">
        방송을 함께할 AI 동료를 만들어보세요. 외모, 목소리, 페르소나를 조합해 캐릭터를 구성할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover"
      >
        <Plus className="h-4 w-4" />
        첫 캐릭터 생성하기
      </button>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-status-danger/40 bg-status-danger/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-status-danger">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-danger" />
      LIVE
    </span>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

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
  const selectedChar = characters.find((c) => c.id === selectedId) ?? characters[0];
  const hasCharacters = characters.length > 0;
  const isFeaturedBroadcasting = !!selectedChar && broadcastingId === selectedChar.id;
  const isAtMaxCharacters = characters.length >= MAX_CHARACTERS_PER_USER;

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-content-primary">내 AI 캐릭터</h1>
        <p className="text-sm text-content-muted">보유한 AI 동료를 확인하고 관리하세요</p>
      </div>

      {error && <ErrorState error={error} />}
      {isLoading && <LoadingSkeleton />}

      {/* Featured 카드 */}
      {!isLoading && hasCharacters && selectedChar && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-content-primary">
            {isFeaturedBroadcasting ? (
              <>
                <LiveBadge />
                현재 방송 중인 AI 캐릭터
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-brand" />
                현재 선택된 AI 캐릭터
              </>
            )}
          </h2>

          <div
            className={`rounded-lg border bg-surface-panel p-6 transition-colors ${
              isFeaturedBroadcasting
                ? "border-status-danger/40"
                : "border-border-strong"
            }`}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <FeaturedAvatar
                  imageUrl={selectedChar.info.imageUrl}
                  fallbackChar={getFallbackChar(selectedChar.name)}
                />

                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold text-content-primary">{getSafeCharacterName(selectedChar.name)}</h3>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-content-secondary">
                      페르소나:{" "}
                      <span className={`font-medium ${getPersonaColor(selectedChar.info.persona)}`}>
                        {getPersonaLabel(selectedChar.info.persona)}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-content-muted">
                      호출어
                    </p>
                    <CallWordBadges
                      callWords={
                        selectedChar.info.triggerWords && selectedChar.info.triggerWords.length > 0
                          ? selectedChar.info.triggerWords
                          : selectedChar.info.callSign.split(",").map((w) => w.trim()).filter(Boolean)
                      }
                    />
                  </div>
                </div>
              </div>

              {(onBroadcastClick || onStopBroadcastClick) && (
                <div className="shrink-0 sm:self-center">
                  {isFeaturedBroadcasting && onStopBroadcastClick ? (
                    <button
                      type="button"
                      onClick={() => onStopBroadcastClick(selectedChar.id)}
                      className="inline-flex items-center gap-2 rounded-md bg-status-danger px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-status-danger-hover active:scale-95"
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
                        className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* 캐릭터 목록 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-content-primary">
            생성한 AI 캐릭터{" "}
            <span className={isAtMaxCharacters ? "text-status-warning" : "text-content-muted"}>
              ({characters.length} / {MAX_CHARACTERS_PER_USER})
            </span>
          </h2>
          <button
            type="button"
            onClick={onCreateClick}
            disabled={isAtMaxCharacters}
            title={isAtMaxCharacters ? `최대 ${MAX_CHARACTERS_PER_USER}개까지 생성 가능합니다` : undefined}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-content-muted"
          >
            <Plus className="h-4 w-4" />
            AI 캐릭터 생성하기
          </button>
        </div>

        {isAtMaxCharacters && (
          <div className="flex items-start gap-2 rounded-md border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-status-warning">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              한 계정당 AI 캐릭터는 최대 <strong>{MAX_CHARACTERS_PER_USER}개</strong>까지 생성할 수 있습니다.
              새로 만들려면 기존 캐릭터를 먼저 삭제해주세요.
            </span>
          </div>
        )}

        {!isLoading && !hasCharacters ? (
          <EmptyState onCreateClick={onCreateClick} />
        ) : (
          <div className="space-y-2">
            {characters.map((character) => {
              const isSelected = selectedId === character.id;
              const isBroadcastingThis = broadcastingId === character.id;
              const callWords =
                character.info.triggerWords && character.info.triggerWords.length > 0
                  ? character.info.triggerWords
                  : character.info.callSign
                      .split(",")
                      .map((w) => w.trim())
                      .filter(Boolean);

              return (
                <div
                  key={character.id}
                  className={`rounded-lg border bg-surface-panel transition-colors ${
                    isBroadcastingThis
                      ? "border-status-danger/40"
                      : isSelected
                        ? "border-brand/50"
                        : "border-border-default hover:border-border-strong"
                  }`}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
                    {/* 좌: 아바타 + 정보 */}
                    <div className="flex flex-1 items-center gap-4">
                      <ListAvatar
                        imageUrl={character.info.imageUrl}
                        fallbackChar={getFallbackChar(character.name)}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-content-primary">
                          {getSafeCharacterName(character.name)}
                        </p>
                        <p className="mt-1 text-xs text-content-muted">
                          <span className={`font-medium ${getPersonaColor(character.info.persona)}`}>
                            [{getPersonaLabel(character.info.persona)}]
                          </span>
                          {callWords.length > 0 && (
                            <>
                              {" "}
                              · 호출어: {callWords.slice(0, 2).join(", ")}
                              {callWords.length > 2 ? "…" : ""}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* 우: 액션 */}
                    <div className="flex items-center gap-1.5">
                      {isBroadcastingThis ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-status-danger/40 bg-status-danger/15 px-3 py-1.5 text-xs font-semibold text-status-danger">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-status-danger" />
                          방송 중
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSelecting || !!broadcastingId}
                          onClick={() => onSelectClick(character.id)}
                          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? "border-brand/50 bg-brand/15 text-brand"
                              : "border-border-default bg-surface-raised text-content-secondary hover:bg-surface-hover hover:text-content-primary"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                          title={broadcastingId ? "방송 중에는 다른 캐릭터를 선택할 수 없습니다" : undefined}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">{isSelected ? "선택됨" : "선택"}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBroadcastingThis}
                        onClick={() => onEditClick(character.id)}
                        className="rounded-md border border-border-default bg-surface-raised p-1.5 text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="rounded-md border border-status-danger/40 bg-status-danger/15 px-2 py-1 text-[11px] font-semibold text-status-danger transition-colors hover:bg-status-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            삭제 확인
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setPendingDeleteId(null)}
                            className="rounded-md border border-border-default bg-surface-raised px-2 py-1 text-[11px] font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isDeleting || isBroadcastingThis}
                          onClick={() => setPendingDeleteId(character.id)}
                          className="rounded-md border border-status-danger/30 bg-status-danger/10 p-1.5 text-status-danger transition-colors hover:bg-status-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
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

// ============================================================
// 아바타 컴포넌트
// ============================================================

function FeaturedAvatar({ imageUrl, fallbackChar }: { imageUrl?: string; fallbackChar: string }) {
  const resolved = resolveAssetUrl(imageUrl);
  if (resolved) {
    return (
      <div className="h-32 w-32 overflow-hidden rounded-lg border border-border-default bg-surface-base">
        <img
          src={resolved}
          alt="character"
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement?.classList.add(
              "flex",
              "items-center",
              "justify-center",
              "text-4xl",
              "font-bold",
              "text-content-primary"
            );
            const fallback = document.createElement("span");
            fallback.textContent = fallbackChar;
            target.parentElement?.appendChild(fallback);
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-border-default bg-surface-base text-4xl font-bold text-content-primary">
      {fallbackChar}
    </div>
  );
}

function ListAvatar({ imageUrl, fallbackChar }: { imageUrl?: string; fallbackChar: string }) {
  const resolved = resolveAssetUrl(imageUrl);
  if (resolved) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-default bg-surface-base">
        <img
          src={resolved}
          alt="character"
          className="h-full w-full object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            target.parentElement?.classList.add(
              "flex",
              "items-center",
              "justify-center",
              "text-sm",
              "font-bold",
              "text-content-primary"
            );
            const fallback = document.createElement("span");
            fallback.textContent = fallbackChar;
            target.parentElement?.appendChild(fallback);
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-base text-sm font-bold text-content-primary">
      {fallbackChar}
    </div>
  );
}
