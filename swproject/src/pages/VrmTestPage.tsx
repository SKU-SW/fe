/**
 * @file 3D 캐릭터 — 실제 백엔드(Gemini) 흐름 연동 테스트 페이지
 *  - PTT/STT → 백엔드 LLM → TTS WebSocket 의 실제 파이프라인을 그대로 사용
 *  - 본 페이지는 그저 캐릭터 + 상태를 화면에 띄우는 "뷰" 역할
 *  - 입력: 방송이 활성화된 상태에서 PTT 또는 텍스트 입력
 *      텍스트 입력은 sttBackgroundService.pushDebugTranscript() 로 주입 → 실제 흐름 그대로 진행
 *  - 출력:
 *      · aiModeStore.currentEmotion → VRM 표정
 *      · useBroadcastWSState().isPlayingTTS → 입 모양 sine 애니메이션
 *      · aiModeStore.currentTranscript / dialogues → 말풍선
 * @dependsOn src/shared/lib/vrmController.ts
 * @dependsOn src/shared/lib/emotionMapping.ts
 * @dependsOn src/services/sttBackgroundService.ts (pushDebugTranscript)
 * @dependsOn src/features/broadcast/hooks/useBroadcastWSState.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/App.tsx (라우트 /vrm-test)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  applyBackendEmotion,
  setMouthOpen,
  setupVrmScene,
  startRenderLoop,
  type VrmSceneRefs,
} from '@/shared/lib/vrmController';
import { mapBackendEmotion } from '@/shared/lib/emotionMapping';
import { useAIModeStore } from '@/shared/stores/aiModeStore';
import { useCharacterStore } from '@/shared/stores/characterStore';
import {
  useCharacter,
  useCharacterSettings,
  useSelectCharacter,
} from '@/features/character/hooks';
import type { VrmPresetResDto } from '@/shared/types/character';
import { resolveAssetUrl } from '@/shared/lib/utils';
import {
  useBroadcastWSState,
  useObsLaunch,
  useStartBroadcast,
  useStreamInfo,
  useTerminateBroadcast,
} from '@/features/broadcast/hooks';
import { ObsGateModal } from '@/features/broadcast/components';
import { sttBackgroundService } from '@/services/sttBackgroundService';
import { useSTT } from '@/features/stt/hooks';
import { formatPttShortcut, useAppSettingsStore } from '@/shared/stores/appSettingsStore';

/** 백엔드 vrmPresets 응답이 비어있을 때 fallback 으로 쓸 로컬 VRM */
const FALLBACK_VRM_URL = '/characters/test-character.vrm';

/** vrmUrl 또는 name 으로부터 사용자 친화적 라벨 추출 */
function deriveVrmLabel(preset: VrmPresetResDto, index: number): string {
  if (preset.name) return preset.name;
  const last = preset.vrmUrl.split('/').pop() ?? '';
  const filename = last.replace(/\.(vrm|glb)$/i, '').toLowerCase();
  if (filename.includes('female')) return '여성 (sku-female)';
  if (filename.includes('male')) return '남성 (sku-male)';
  return `VRM ${index + 1}`;
}

export default function VrmTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refsRef = useRef<VrmSceneRefs | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);

  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expressionKeysLog, setExpressionKeysLog] = useState<Record<string, string> | null>(null);
  const [fps, setFps] = useState(0);
  const [debugText, setDebugText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // 백엔드의 VRM 프리셋 목록 (sku-male / sku-female)
  const { settings } = useCharacterSettings();
  const vrmPresets = useMemo(() => settings?.vrmPresets ?? [], [settings?.vrmPresets]);
  const [selectedVrmIndex, setSelectedVrmIndex] = useState(0);

  // 사용자가 직접 입력한 S3 URL — localStorage 에 저장돼 새로고침 후도 유지.
  const [manualUrl, setManualUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('vrm-test-manual-url') ?? '';
  });
  const [manualUrlDraft, setManualUrlDraft] = useState<string>(manualUrl);

  const applyManualUrl = () => {
    const trimmed = manualUrlDraft.trim();
    setManualUrl(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) window.localStorage.setItem('vrm-test-manual-url', trimmed);
      else window.localStorage.removeItem('vrm-test-manual-url');
    }
  };

  const clearManualUrl = () => {
    setManualUrl('');
    setManualUrlDraft('');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('vrm-test-manual-url');
    }
  };

  // 현재 로드할 VRM URL: 수동 입력 > 백엔드 프리셋 > 로컬 fallback
  const currentVrmUrl = useMemo(() => {
    if (manualUrl) return manualUrl;
    if (vrmPresets.length === 0) return FALLBACK_VRM_URL;
    const safeIndex = Math.min(selectedVrmIndex, vrmPresets.length - 1);
    return resolveAssetUrl(vrmPresets[safeIndex]?.vrmUrl) || FALLBACK_VRM_URL;
  }, [manualUrl, vrmPresets, selectedVrmIndex]);

  // 백엔드 실제 흐름 상태
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  const mode = useAIModeStore((s) => s.mode);
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const dialogues = useAIModeStore((s) => s.dialogues);
  const sttEnabled = useAIModeStore((s) => s.toggles.sttEnabled);
  const isPaused = useAIModeStore((s) => s.isPaused);

  const { isConnected: wsConnected, isPlayingTTS, error: wsError } = useBroadcastWSState();
  const { isListening } = useSTT();

  const pttShortcut = useAppSettingsStore((s) => s.pttShortcut);

  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  // DashboardPage 진입 시 호출되는 두 GET 을 동일하게 호출.
  // 백엔드가 이 두 호출을 받아야 stream 세션을 active 로 유지함 (단순 WS 연결만으론 부족).
  // 호출 결과 자체는 여기서 사용하지 않지만 부작용으로 store/cache 업데이트.
  useCharacter(selectedCharacterId);
  useStreamInfo({ size: 1 });

  const { select: selectCharacter, isPending: isSelectingCharacter, error: selectError } =
    useSelectCharacter();
  const { start: startBroadcastSession, isPending: isStartingBroadcast, error: startError } =
    useStartBroadcast();
  const {
    terminate: terminateBroadcastSession,
    isPending: isTerminatingBroadcast,
    error: terminateError,
  } = useTerminateBroadcast();
  const { obsStatus, obsError, obsDiagnostics, launchObs, resetObsStatus } = useObsLaunch();
  const overlayUrl = useMemo(() => {
    if (import.meta.env.DEV) return 'http://localhost:5173/#/overlay';
    return 'http://127.0.0.1:5174/#/overlay';
  }, []);

  // OBS 게이트 진행 중인 캐릭터 ID (null = 게이트 닫힘)
  const [obsGatePending, setObsGatePending] = useState<number | null>(null);

  const isBroadcasting = mode === 'broadcasting' && !!broadcastStreamId;
  const isStartingTestSession = isSelectingCharacter || isStartingBroadcast || obsGatePending !== null;
  const startSessionError = selectError ?? startError;

  // CharacterPage.enterObsGate / performStart 와 동일한 흐름:
  //   1) select(cid, true)              ← PATCH /characters/{id} { isSelected: true }
  //   2) setObsGatePending + launchObs  ← OBS 실행 + 셋업 (백엔드 stream 활성화 신호)
  //   3) obsStatus === "setup_ok" 감지  ← useEffect 에서 performStart 호출
  //      a) select(cid, true) again
  //      b) POST /stream/start?characterId=...
  const handleStartTestSession = async () => {
    if (selectedCharacterId == null) return;
    const selected = await selectCharacter(selectedCharacterId, true);
    if (!selected) return;
    setObsGatePending(selectedCharacterId);
    void launchObs(overlayUrl);
  };

  // OBS 셋업 완료 → 방송 세션 시작
  const performStart = useCallback(
    async (cid: number) => {
      const selected = await selectCharacter(cid, true);
      if (!selected) return;
      await startBroadcastSession(cid);
    },
    [selectCharacter, startBroadcastSession]
  );

  useEffect(() => {
    if (obsGatePending === null) return;
    if (obsStatus !== 'setup_ok') return;
    const cid = obsGatePending;
    setObsGatePending(null);
    void performStart(cid);
  }, [obsGatePending, obsStatus, performStart]);

  const handleObsRetry = useCallback(() => {
    void launchObs(overlayUrl);
  }, [launchObs, overlayUrl]);

  const handleObsCancel = useCallback(() => {
    setObsGatePending(null);
    resetObsStatus();
  }, [resetObsStatus]);

  const handleObsManualConfirm = useCallback(() => {
    if (obsGatePending === null) return;
    const cid = obsGatePending;
    setObsGatePending(null);
    void performStart(cid);
  }, [obsGatePending, performStart]);

  const handleObsForceStart = useCallback(() => {
    if (obsGatePending === null) return;
    const cid = obsGatePending;
    setObsGatePending(null);
    void performStart(cid);
  }, [obsGatePending, performStart]);

  const handleTerminateTestSession = async () => {
    await terminateBroadcastSession();
  };

  // 최근 AI 발화 — currentTranscript 가 비어 있으면 dialogues 의 마지막 AI 항목
  const lastAiSpeech = useMemo(() => {
    if (currentTranscript) return currentTranscript;
    for (let i = dialogues.length - 1; i >= 0; i -= 1) {
      const d = dialogues[i];
      if (d.speaker === 'ai' && d.text) return d.text;
    }
    return null;
  }, [currentTranscript, dialogues]);

  // VRM 씬 셋업 — currentVrmUrl 변경 시 재로드
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;
    setLoadStatus('loading');
    setErrorMessage(null);

    setupVrmScene(canvas, currentVrmUrl)
      .then((refs) => {
        if (!mounted) {
          refs.dispose();
          return;
        }
        refsRef.current = refs;
        stopLoopRef.current = startRenderLoop(refs);
        setExpressionKeysLog(refs.expressionKeys);
        setLoadStatus('ready');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '알 수 없는 오류';
        console.error('[VrmTestPage] VRM 로드 실패:', err);
        setErrorMessage(message);
        setLoadStatus('error');
      });

    return () => {
      mounted = false;
      stopLoopRef.current?.();
      refsRef.current?.dispose();
      refsRef.current = null;
    };
  }, [currentVrmUrl]);

  // FPS 측정
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const measure = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 백엔드 emotion 변화 → VRM 표정 적용
  useEffect(() => {
    if (loadStatus !== 'ready' || !refsRef.current) return;
    applyBackendEmotion(refsRef.current, currentEmotion);
  }, [currentEmotion, loadStatus]);

  // TTS 재생 중 → 입 모양 sine 애니메이션
  useEffect(() => {
    if (loadStatus !== 'ready') return;
    if (!isPlayingTTS) {
      if (refsRef.current) setMouthOpen(refsRef.current, 0);
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (refsRef.current) {
        const value = Math.max(0, Math.sin(now / 60) * 0.5 + 0.3);
        setMouthOpen(refsRef.current, value);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (refsRef.current) setMouthOpen(refsRef.current, 0);
    };
  }, [isPlayingTTS, loadStatus]);

  // 디버그 텍스트 전송 — sttBackgroundService 로 실제 STT 결과처럼 주입
  // AppInitializer 의 final transcript 핸들러가 받아 broadcastWSBackgroundService.sendChat() 호출 → 백엔드 Gemini 가 응답
  const handleSendDebugText = async () => {
    const trimmed = debugText.trim();
    if (!trimmed) return;
    setSendError(null);
    setIsSending(true);
    try {
      await sttBackgroundService.pushDebugTranscript(trimmed);
      setDebugText('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '전송 실패';
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  const currentMapping = mapBackendEmotion(currentEmotion);

  return (
    <div className="flex h-full flex-col gap-4 px-0 py-0 text-content-primary">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold">3D 캐릭터 테스트</h1>
          <p className="mt-1 text-sm text-content-muted">
            실제 백엔드(Gemini) PTT → LLM → TTS 흐름을 그대로 사용해 캐릭터를 검증합니다.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-content-muted">FPS</span>
          <span
            className={`text-lg font-bold ${
              fps >= 50
                ? 'text-status-success'
                : fps >= 30
                  ? 'text-status-warning'
                  : 'text-status-danger'
            }`}
          >
            {fps}
          </span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[1fr_400px] gap-6 overflow-hidden">
        {/* 좌: VRM 캔버스 + 말풍선 */}
        <div className="relative rounded-xl border border-border-default bg-surface-panel">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          {loadStatus === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center text-content-muted">
              VRM 모델 로딩 중...
            </div>
          )}
          {loadStatus === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
                <p className="font-bold">VRM 로드 실패</p>
                <p className="mt-2">{errorMessage}</p>
                <p className="mt-2 text-xs">
                  public/characters/test-character.vrm 경로 확인 / VRM 포맷 호환 확인
                </p>
              </div>
            </div>
          )}

          {/* 상태 배지 (좌상단) */}
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface-base/90 px-3 py-1 text-xs font-medium text-content-secondary shadow-sm backdrop-blur-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                isPlayingTTS ? 'bg-brand' : isListening ? 'bg-status-success' : 'bg-content-muted'
              }`}
            />
            {isPlayingTTS ? '말하는 중' : isListening ? '듣는 중' : '대기'}
          </div>

          {/* 말풍선 — AI 발화 중이거나 마지막 발화가 남아 있을 때 */}
          {lastAiSpeech && (
            <div className="absolute inset-x-6 bottom-6 rounded-xl border border-brand/30 bg-surface-base/95 p-4 shadow-lg backdrop-blur-sm">
              <div className="mb-1 flex items-center gap-2 text-xs text-content-muted">
                <span className="rounded-full bg-brand/15 px-2 py-0.5 font-bold text-brand">
                  AI 캐릭터
                </span>
                <span className="font-mono">{currentEmotion}</span>
                {isPlayingTTS && (
                  <span className="ml-auto inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                    말하는 중
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-content-primary">{lastAiSpeech}</p>
            </div>
          )}
        </div>

        {/* 우: 상태 + 컨트롤 */}
        <aside className="space-y-4 overflow-y-auto pr-1">
          {/* VRM 프리셋 선택 — 백엔드 vrmPresets 응답 기반 */}
          <section className="rounded-lg border border-border-default bg-surface-panel p-4 text-sm">
            <p className="mb-2 font-semibold text-content-primary">VRM 모델</p>

            {/* 백엔드 vrmPresets — 있으면 토글 */}
            {vrmPresets.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {vrmPresets.map((preset, index) => {
                  const active = !manualUrl && index === selectedVrmIndex;
                  return (
                    <button
                      key={preset.characterVrmId ?? preset.presetId ?? index}
                      type="button"
                      onClick={() => {
                        clearManualUrl();
                        setSelectedVrmIndex(index);
                      }}
                      className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? 'border-brand bg-brand/10 text-content-primary'
                          : 'border-border-default bg-surface-base text-content-secondary hover:bg-surface-hover'
                      }`}
                    >
                      <p className="font-semibold">{deriveVrmLabel(preset, index)}</p>
                      <p className="mt-0.5 break-all font-mono text-[10px] text-content-muted">
                        {preset.vrmUrl.split('/').pop()}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-content-muted">
                백엔드 vrmPresets 응답이 비어 있습니다. 아래에 S3 URL 을 직접 입력해 띄워보세요.
              </p>
            )}

            {/* 수동 URL 입력 — S3 의 model.vrm URL 직접 붙여넣기 */}
            <div className="mt-3 rounded-md border border-border-default bg-surface-base p-3">
              <p className="mb-1 text-xs font-semibold text-content-secondary">
                S3 URL 직접 입력
              </p>
              <p className="mb-2 text-[11px] text-content-muted">
                예: <code className="font-mono">https://sku-sw.s3.&lt;region&gt;.amazonaws.com/character-3d/male/vrm-male-01/model.vrm</code>
              </p>
              <input
                type="text"
                value={manualUrlDraft}
                onChange={(e) => setManualUrlDraft(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-border-default bg-surface-panel px-2 py-1.5 text-xs text-content-primary focus:border-brand focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyManualUrl}
                  disabled={!manualUrlDraft.trim() || manualUrlDraft.trim() === manualUrl}
                  className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-content-inverse transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  로드
                </button>
                <button
                  type="button"
                  onClick={clearManualUrl}
                  disabled={!manualUrl}
                  className="rounded-md border border-border-default bg-surface-panel px-3 py-1.5 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  지우기
                </button>
                {manualUrl && (
                  <span className="ml-auto rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                    수동 입력 활성
                  </span>
                )}
              </div>
              <p className="mt-2 text-[10px] text-content-muted">
                CORS / 공개 접근 권한 필요. 로드 실패 시 캔버스에 에러 표시됨.
              </p>
            </div>

            <p className="mt-2 break-all text-[10px] text-content-muted">
              현재 로드: <span className="font-mono">{currentVrmUrl}</span>
            </p>
          </section>

          {/* 백엔드 연결 상태 */}
          <section className="rounded-lg border border-border-default bg-surface-panel p-4 text-sm">
            <p className="mb-2 font-semibold text-content-primary">백엔드 연결 상태</p>
            <ul className="space-y-1.5 text-xs">
              <StatusRow
                label="방송"
                ok={isBroadcasting}
                okText="활성"
                ngText="비활성 (대시보드에서 방송 시작 필요)"
              />
              <StatusRow label="WebSocket" ok={wsConnected} okText="연결됨" ngText="끊김" />
              <StatusRow
                label="STT 마이크"
                ok={sttEnabled}
                okText="켜짐"
                ngText="꺼짐 (사이드바에서 MIC 토글)"
              />
              <StatusRow label="AI 응답" ok={!isPaused} okText="활성" ngText="일시정지" />
            </ul>
            {wsError && (
              <p className="mt-2 rounded border border-status-danger/30 bg-status-danger/10 p-2 text-xs text-status-danger">
                WS 오류: {wsError}
              </p>
            )}

            {/* 테스트 세션 컨트롤 — OBS/Chzzk 없이 백엔드 세션만 띄워 캐릭터 검증 */}
            {!isBroadcasting ? (
              <div className="mt-3 space-y-2">
                {selectedCharacterId == null ? (
                  <Link
                    to="/character"
                    className="block w-full rounded-md bg-brand px-3 py-2 text-center text-xs font-semibold text-content-inverse transition-colors hover:opacity-90"
                  >
                    먼저 캐릭터를 선택해주세요
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleStartTestSession()}
                    disabled={isStartingTestSession}
                    className="block w-full rounded-md bg-brand px-3 py-2 text-center text-xs font-semibold text-content-inverse transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSelectingCharacter
                      ? '캐릭터 선택 중...'
                      : obsGatePending !== null
                        ? 'OBS 준비 중...'
                        : isStartingBroadcast
                          ? '세션 시작 중...'
                          : '테스트 세션 시작'}
                  </button>
                )}
                <p className="text-[11px] text-content-muted">
                  대시보드 방송 시작과 동일한 흐름(캐릭터 select → OBS 셋업 → /stream/start)을 따릅니다.
                  Chzzk 송출은 일어나지 않아요.
                </p>
                {startSessionError && (
                  <p className="text-xs text-status-danger">{startSessionError}</p>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleTerminateTestSession()}
                  disabled={isTerminatingBroadcast}
                  className="block w-full rounded-md border border-status-danger/40 bg-status-danger/10 px-3 py-2 text-center text-xs font-semibold text-status-danger transition-colors hover:bg-status-danger/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isTerminatingBroadcast ? '종료 중...' : '방송 세션 종료'}
                </button>
                <p className="text-[11px] text-content-muted">
                  주의: 실제 방송이 켜져 있다면 이 버튼이 그 방송도 종료시킵니다.
                </p>
                {terminateError && (
                  <p className="text-xs text-status-danger">{terminateError}</p>
                )}
              </div>
            )}
          </section>

          {/* 입력 방법 */}
          <section className="rounded-lg border border-border-default bg-surface-panel p-4 text-sm">
            <p className="mb-2 font-semibold text-content-primary">입력 방법</p>

            {/* PTT 안내 */}
            <div className="mb-3 rounded-md border border-border-default bg-surface-base p-3">
              <p className="text-xs font-semibold text-content-secondary">방법 1 — PTT (실제 마이크)</p>
              <p className="mt-1 text-xs text-content-muted">
                <span className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[11px]">
                  {formatPttShortcut(pttShortcut)}
                </span>
                {' '}키를 눌러 말하면 STT → Gemini → TTS 가 순서대로 동작합니다.
              </p>
            </div>

            {/* 텍스트 입력 (디버그) */}
            <div className="rounded-md border border-border-default bg-surface-base p-3">
              <p className="text-xs font-semibold text-content-secondary">
                방법 2 — 텍스트 직접 입력
              </p>
              <p className="mt-1 text-[11px] text-content-muted">
                STT 결과처럼 백엔드에 주입돼 Gemini 응답이 옵니다.
              </p>
              <textarea
                value={debugText}
                onChange={(e) => setDebugText(e.target.value)}
                placeholder="예: 안녕! 오늘 뭐 했어?"
                rows={3}
                disabled={!isBroadcasting || isSending}
                className="mt-2 w-full resize-none rounded-md border border-border-default bg-surface-panel px-3 py-2 text-sm text-content-primary focus:border-brand focus:outline-none disabled:opacity-50"
              />
              {sendError && (
                <p className="mt-1 text-xs text-status-danger">{sendError}</p>
              )}
              <button
                type="button"
                onClick={() => void handleSendDebugText()}
                disabled={!isBroadcasting || isSending || !debugText.trim()}
                className="mt-2 w-full rounded-md bg-brand px-3 py-2 text-xs font-semibold text-content-inverse transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? '전송 중...' : '전송 (Gemini 호출)'}
              </button>
            </div>
          </section>

          {/* 현재 emotion / 매핑 */}
          <section className="rounded-lg border border-border-default bg-surface-panel p-4 text-sm">
            <p className="text-content-muted">현재 emotion / VRM 표정 매핑</p>
            <p className="mt-1">
              <span className="font-mono text-content-primary">{currentEmotion}</span>
              <span className="mx-2 text-content-muted">→</span>
              <span className="font-semibold">{currentMapping.vrm}</span>
              <span className="ml-2 text-xs text-content-muted">
                강도 {currentMapping.intensity}
              </span>
            </p>
          </section>

          {/* 디버그 */}
          {expressionKeysLog && (
            <details className="rounded-lg border border-border-default bg-surface-panel p-4">
              <summary className="cursor-pointer text-sm text-content-muted">
                감지된 VRM 표정 키 (디버그)
              </summary>
              <pre className="mt-2 overflow-x-auto rounded bg-surface-base p-2 text-xs text-content-secondary">
                {JSON.stringify(expressionKeysLog, null, 2)}
              </pre>
            </details>
          )}
        </aside>
      </div>

      {obsGatePending !== null && (
        <ObsGateModal
          obsStatus={obsStatus}
          obsError={obsError}
          obsDiagnostics={obsDiagnostics}
          overlayUrl={overlayUrl}
          onRetry={handleObsRetry}
          onConfirmManualReady={handleObsManualConfirm}
          onForceStart={handleObsForceStart}
          onCancel={handleObsCancel}
        />
      )}
    </div>
  );
}

interface StatusRowProps {
  label: string;
  ok: boolean;
  okText: string;
  ngText: string;
}

function StatusRow({ label, ok, okText, ngText }: StatusRowProps) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${ok ? 'bg-status-success' : 'bg-content-muted'}`}
      />
      <span className="font-semibold text-content-secondary">{label}</span>
      <span className={ok ? 'text-content-primary' : 'text-content-muted'}>
        {ok ? okText : ngText}
      </span>
    </li>
  );
}
