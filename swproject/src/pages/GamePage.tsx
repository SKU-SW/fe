/**
 * @file 게임 연동 페이지 (8. 게임 연동)
 * @created Game Integration - UI
 * @dependsOn src/shared/stores/gameStore.ts
 * @dependsOn src/shared/types/game.ts
 * @usedBy src/App.tsx (/game 라우트)
 *
 * 8.1  LoL 자동 감지 → 게임 모드 전환
 * 8.2  실시간 게임 현황 (챔피언, KDA, 골드, CS, 게임모드, 진행시간)
 * 8.3  이벤트 기반 AI 리액션
 * 8.4  이벤트 트리거 On/Off + AI 반응 속도 조절
 */

import { Gamepad2, Wifi, WifiOff, Clock, Sword, Coins, Target } from 'lucide-react';
import { useGameStore } from '@/shared/stores/gameStore';
import type { AIReactionSpeed, GameEventTriggerSettings } from '@/shared/types/game';

// ──────────────────────────────────────────────
// 이벤트 트리거 레이블 정의
// ──────────────────────────────────────────────

const TRIGGER_LABELS: Record<keyof GameEventTriggerSettings, { label: string; desc: string }> = {
  kill:       { label: '킬',     desc: '적 챔피언을 처치했을 때' },
  death:      { label: '데스',   desc: '내 챔피언이 처치당했을 때' },
  assist:     { label: '어시스트', desc: '처치에 기여했을 때' },
  multi_kill: { label: '멀티킬', desc: '더블킬 이상 달성했을 때' },
  objective:  { label: '오브젝트', desc: '드래곤·바론·전령 처치 시' },
  victory:    { label: '승리',   desc: '게임에서 이겼을 때' },
  defeat:     { label: '패배',   desc: '게임에서 졌을 때' },
};

const SPEED_OPTIONS: { value: AIReactionSpeed; label: string; delay: string }[] = [
  { value: 'fast',   label: '빠름', delay: '약 1초' },
  { value: 'normal', label: '보통', delay: '약 2초' },
  { value: 'slow',   label: '느림', delay: '약 4초' },
];

// ──────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────

function formatGameTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ──────────────────────────────────────────────
// 서브 컴포넌트
// ──────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        checked ? 'bg-brand' : 'bg-surface-raised'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-surface-raised px-4 py-3 min-w-[80px]">
      <div className="flex items-center gap-1 text-content-muted">{icon}<span className="text-xs">{label}</span></div>
      <span className="text-base font-bold text-content-primary">{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// 메인 페이지
// ──────────────────────────────────────────────

export default function GamePage() {
  const triggerSettings = useGameStore((s) => s.triggerSettings);
  const reactionSpeed   = useGameStore((s) => s.reactionSpeed);
  const isGameRunning   = useGameStore((s) => s.isGameRunning);
  const gameState       = useGameStore((s) => s.gameState);
  const setTrigger      = useGameStore((s) => s.setTrigger);
  const setReactionSpeed = useGameStore((s) => s.setReactionSpeed);

  const activePlayer = gameState?.activePlayer ?? null;
  const myPlayer = gameState?.allPlayers.find(
    (p) => p.summonerName === activePlayer?.summonerName
  ) ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* ── 헤더 카드 ── */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-5 transition-colors">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-brand/10 p-2 text-brand">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-content-muted">
              LoL 게임을 실행하면 자동으로 감지되어 AI 동료 캐릭터가 게임 모드로 전환됩니다.
              게임 중 발생하는 이벤트에 따라 캐릭터가 페르소나에 맞게 반응합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 연결 상태 카드 ── */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-5 transition-colors">
        {isGameRunning && activePlayer ? (
          /* 게임 실행 중 */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-success" />
                </span>
                <span className="text-sm font-medium text-status-success">연결됨</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-content-muted">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatGameTime(gameState?.gameData.gameTime ?? 0)}</span>
                <span className="ml-1 rounded bg-surface-raised px-1.5 py-0.5">
                  {gameState?.gameData.gameMode ?? '—'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-content-muted">챔피언</p>
                  <p className="text-sm font-semibold text-content-primary">
                    {myPlayer?.championName ?? '—'}
                  </p>
                </div>
              </div>

              <div className="ml-auto flex flex-wrap gap-2">
                <StatBadge
                  icon={<Sword className="h-3.5 w-3.5" />}
                  label="KDA"
                  value={`${activePlayer.scores.kills} / ${activePlayer.scores.deaths} / ${activePlayer.scores.assists}`}
                />
                <StatBadge
                  icon={<Coins className="h-3.5 w-3.5" />}
                  label="골드"
                  value={`${Math.floor(activePlayer.currentGold).toLocaleString()}`}
                />
                <StatBadge
                  icon={<Target className="h-3.5 w-3.5" />}
                  label="CS"
                  value={String(activePlayer.scores.creepScore)}
                />
                <StatBadge
                  icon={<span className="text-xs font-bold">Lv</span>}
                  label="레벨"
                  value={String(activePlayer.championStats.level)}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 대기 중 */
          <div className="flex items-center gap-4 py-3">
            <div className="rounded-lg bg-surface-raised p-3 text-content-muted">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-content-muted" />
                <span className="text-sm font-medium text-content-secondary">게임 감지 대기 중</span>
              </div>
              <p className="mt-1 text-xs text-content-muted">
                LoL 게임을 실행하면 자동으로 연결됩니다.
              </p>
            </div>
            <div className="ml-auto">
              <Wifi className="h-5 w-5 text-content-muted opacity-30" />
            </div>
          </div>
        )}
      </section>

      {/* ── 설정 2열 ── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* 이벤트 트리거 설정 */}
        <section className="rounded-xl border border-border-strong bg-surface-panel p-5 transition-colors">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-content-primary">이벤트 트리거</h2>
            <p className="mt-1 text-xs text-content-muted">
              AI 동료 캐릭터가 반응할 게임 이벤트를 선택하세요.
            </p>
          </div>

          <ul className="space-y-3">
            {(Object.keys(TRIGGER_LABELS) as (keyof GameEventTriggerSettings)[]).map((key) => {
              const { label, desc } = TRIGGER_LABELS[key];
              return (
                <li key={key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-content-primary">{label}</p>
                    <p className="text-xs text-content-muted">{desc}</p>
                  </div>
                  <ToggleSwitch
                    checked={triggerSettings[key]}
                    onChange={(v) => setTrigger(key, v)}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {/* AI 반응 속도 */}
        <section className="rounded-xl border border-border-strong bg-surface-panel p-5 transition-colors">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-content-primary">AI 반응 속도</h2>
            <p className="mt-1 text-xs text-content-muted">
              게임 이벤트 발생 후 AI가 반응하기까지의 딜레이를 설정합니다.
            </p>
          </div>

          <div className="space-y-2">
            {SPEED_OPTIONS.map(({ value, label, delay }) => {
              const selected = reactionSpeed === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReactionSpeed(value)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    selected
                      ? 'border-brand bg-brand/10'
                      : 'border-border-default bg-surface-raised hover:border-border-strong hover:bg-surface-hover'
                  }`}
                  aria-pressed={selected}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-4 w-4 rounded-full border-2 transition-colors ${
                        selected ? 'border-brand bg-brand' : 'border-border-strong bg-transparent'
                      }`}
                    >
                      {selected && (
                        <span className="flex h-full w-full items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      )}
                    </span>
                    <span className={`text-sm font-medium ${selected ? 'text-brand' : 'text-content-primary'}`}>
                      {label}
                    </span>
                  </div>
                  <span className="text-xs text-content-muted">{delay}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 rounded-lg bg-surface-raised px-3 py-2 text-xs text-content-muted">
            반응 속도가 빠를수록 이벤트 직후 즉각 반응하며,
            느릴수록 상황을 파악한 후 자연스럽게 반응합니다.
          </p>
        </section>
      </div>

    </div>
  );
}
