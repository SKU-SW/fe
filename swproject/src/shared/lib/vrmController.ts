/**
 * @file VRM 모델 로드, 표정 전환, 입 모양 동기화 헬퍼
 * @dependsOn three, @pixiv/three-vrm, ./emotionMapping
 * @usedBy src/pages/OverlayPage.tsx (OverlayVrmCanvas)
 *
 * 사용 흐름:
 *   1) setupVrmScene(canvas, vrmUrl) → 씬/카메라/모델 초기화
 *   2) startRenderLoop(refs)         → 매 프레임 vrm.update + render
 *   3) applyBackendEmotion(refs, 'happy') → 표정 전환
 *   4) setMouthOpen(refs, volume)    → TTS 음량 → 입 모양
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMHumanBoneName, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

import {
  DEFAULT_VRM_KEY_CANDIDATES,
  mapBackendEmotion,
  type VrmEmotion,
} from './emotionMapping';

export interface VrmSceneRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  vrm: VRM;
  clock: THREE.Clock;
  /** 매핑된 실제 expression key (이 VRM 모델 기준) */
  expressionKeys: Record<VrmEmotion, string>;
  currentEmotion: VrmEmotion;
  /** dispose 시 호출. 메모리/이벤트 정리 */
  dispose: () => void;
}

/**
 * VRM 기본 T-pose 는 양팔이 옆으로 뻗어 있어 어색함.
 * 어깨를 안쪽으로 회전시켜 양팔이 옆구리로 자연스럽게 떨어지는 증명사진 자세를 만든다.
 * 팔꿈치는 거의 펴진 상태(미세하게만 굽힘) — 클로즈업 시 손은 화면 밖, 멀리서 봐도 자연스럽게.
 * 모델별로 본 회전 축이 미세하게 다를 수 있으니, 값이 어색하면 미세 튜닝 필요.
 */
function applyNaturalPose(vrm: VRM): void {
  const humanoid = vrm.humanoid;
  if (!humanoid) return;
  const set = (name: VRMHumanBoneName, x: number, y: number, z: number) => {
    const node = humanoid.getNormalizedBoneNode(name);
    if (node) node.rotation.set(x, y, z);
  };
  // 어깨에서 팔을 옆구리 방향으로 약 72도 내림.
  set(VRMHumanBoneName.LeftUpperArm, 0, 0, 1.25);
  set(VRMHumanBoneName.RightUpperArm, 0, 0, -1.25);
  // 팔꿈치는 거의 펴짐 — 손이 자연스럽게 옆구리에 떨어지도록 미세하게만 굽힘.
  set(VRMHumanBoneName.LeftLowerArm, 0, -0.1, 0);
  set(VRMHumanBoneName.RightLowerArm, 0, 0.1, 0);
}

/**
 * 로드된 VRM 모델이 실제로 가진 expression key 를 후보 배열로부터 매칭.
 * 매칭 실패 시 후보 첫 항목을 fallback (없으면 setValue 호출이 무해하게 무시됨).
 */
function detectExpressionKeys(vrm: VRM): Record<VrmEmotion, string> {
  const map = vrm.expressionManager?.expressionMap ?? {};
  const available = new Set(Object.keys(map));
  const result = {} as Record<VrmEmotion, string>;
  (Object.keys(DEFAULT_VRM_KEY_CANDIDATES) as VrmEmotion[]).forEach((emotion) => {
    const candidates = DEFAULT_VRM_KEY_CANDIDATES[emotion];
    const found = candidates.find((c) => available.has(c));
    result[emotion] = found ?? candidates[0];
  });
  return result;
}

/**
 * VRM 모델 로드 + Three.js 씬/카메라/조명 셋업.
 */
export async function setupVrmScene(
  canvas: HTMLCanvasElement,
  vrmUrl: string
): Promise<VrmSceneRefs> {
  const width = canvas.clientWidth || 480;
  const height = canvas.clientHeight || 640;

  const scene = new THREE.Scene();
  // 가까운 정면 컷: 카메라/lookAt 둘 다 얼굴 높이(y=1.5)로 수평 정면.
  // z 거리를 좁혀 어깨가 화면 양쪽 끝에 닿도록 캐릭터가 화면을 꽉 채우게 함.
  const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
  camera.position.set(0, 1.5, 1.3);
  camera.lookAt(new THREE.Vector3(0, 1.5, 0));

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // 조명
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(1, 1.5, 1);
  scene.add(dir);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // VRM 로드
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(vrmUrl);
  const vrm = gltf.userData.vrm as VRM | undefined;
  if (!vrm) {
    throw new Error('[vrmController] VRM extension not found in loaded file');
  }

  // 성능 최적화
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.removeUnnecessaryJoints(gltf.scene);

  scene.add(vrm.scene);
  // VRM 표준은 -Z 방향을 바라봄. 정면으로 돌리기 위해 180도 회전.
  vrm.scene.rotation.y = Math.PI;

  // 기본 T-pose 를 자연스러운 증명사진 자세(양손 옆구리)로 보정.
  applyNaturalPose(vrm);

  // 리사이즈 핸들러
  const handleResize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };
  window.addEventListener('resize', handleResize);

  const dispose = () => {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry?.dispose();
      const mat = (obj as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
      else mat?.dispose?.();
    });
  };

  return {
    scene,
    camera,
    renderer,
    vrm,
    clock: new THREE.Clock(),
    expressionKeys: detectExpressionKeys(vrm),
    currentEmotion: 'neutral',
    dispose,
  };
}

/**
 * 매 프레임 vrm.update + render 루프 시작.
 * 반환값으로 stop 함수 제공.
 */
export function startRenderLoop(refs: VrmSceneRefs): () => void {
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const delta = refs.clock.getDelta();
    refs.vrm.update(delta);
    refs.renderer.render(refs.scene, refs.camera);
    requestAnimationFrame(tick);
  };
  tick();
  return () => {
    stopped = true;
  };
}

/**
 * 백엔드 emotion 문자열 → VRM 표정 즉시 적용.
 * talking 은 표정 변경 없이 입 모양만 따로 제어해야 함(이 함수는 noop).
 */
export function applyBackendEmotion(refs: VrmSceneRefs, backendEmotion: string): void {
  const mapping = mapBackendEmotion(backendEmotion);
  if (mapping.isTalking) {
    // talking: 표정 그대로 유지. 입 모양은 setMouthOpen 으로 별도 제어.
    return;
  }

  const expressionManager = refs.vrm.expressionManager;
  if (!expressionManager) return;

  // 다른 감정 표정 모두 0 으로 (잔여 표정 제거)
  (Object.keys(refs.expressionKeys) as VrmEmotion[]).forEach((emotion) => {
    expressionManager.setValue(refs.expressionKeys[emotion], 0);
  });

  // 목표 표정 적용
  expressionManager.setValue(refs.expressionKeys[mapping.vrm], mapping.intensity);
  refs.currentEmotion = mapping.vrm;
}

/**
 * TTS 음량(0~1) → 입 벌림(aa) 정도 동기화.
 * 매 프레임 호출 가능.
 */
export function setMouthOpen(refs: VrmSceneRefs, volume: number): void {
  const clamped = Math.min(1, Math.max(0, volume));
  refs.vrm.expressionManager?.setValue('aa', clamped);
}

/**
 * 5개 visem 가중치를 VRM 표정에 동시 적용.
 * 지원되지 않는 visem은 무시됨 (setValue가 무해하게 넘어감).
 */
export function setVisemeWeights(
  refs: VrmSceneRefs,
  weights: { aa: number; ih: number; ou: number; ee: number; oh: number } | null | undefined
): void {
  const m = refs.vrm.expressionManager;
  if (!m || !weights) return;

  const clamp = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
  const available = m.expressionMap;
  if ('aa' in available) m.setValue('aa', clamp(weights.aa));
  if ('ih' in available) m.setValue('ih', clamp(weights.ih));
  if ('ou' in available) m.setValue('ou', clamp(weights.ou));
  if ('ee' in available) m.setValue('ee', clamp(weights.ee));
  if ('oh' in available) m.setValue('oh', clamp(weights.oh));
}

/**
 * 표정 보간 (현재 표정 → 목표 표정 자연스럽게 전환).
 */
export function smoothTransition(
  refs: VrmSceneRefs,
  toEmotion: VrmEmotion,
  durationMs = 800
): void {
  const expressionManager = refs.vrm.expressionManager;
  if (!expressionManager) return;

  const fromKey = refs.expressionKeys[refs.currentEmotion];
  const toKey = refs.expressionKeys[toEmotion];
  const start = performance.now();

  const animate = (now: number) => {
    const t = Math.min((now - start) / durationMs, 1);
    expressionManager.setValue(fromKey, 1 - t);
    expressionManager.setValue(toKey, t);
    if (t < 1) requestAnimationFrame(animate);
    else refs.currentEmotion = toEmotion;
  };
  animate(performance.now());
}
