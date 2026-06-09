/**
 * @file 백엔드 emotion → 표준 VRM 표정 매핑
 * @dependsOn 없음 (순수 함수)
 * @usedBy src/shared/lib/vrmController.ts, src/pages/VrmTestPage.tsx
 *
 * 흐름:
 *   백엔드 응답 emotion (예: 'fear', 'tired') →
 *   표준 5감정 (happy/angry/sad/surprised/neutral) +
 *   권장 강도 →
 *   캐릭터 VRM 모델의 실제 expression key (VRM 0.x 'sorrow' vs 1.0 'sad' 등)
 */

export type VrmEmotion = 'happy' | 'angry' | 'sad' | 'surprised' | 'neutral';

// 백엔드가 보내는 emotion 종류
export type BackendEmotion =
  | 'happy'
  | 'angry'
  | 'sad'
  | 'fear'
  | 'tired'
  | 'default'
  | 'talking';

export interface EmotionMapping {
  vrm: VrmEmotion;
  intensity: number;
  /** talking 은 표정 변경 없이 입 모양만 활성 */
  isTalking?: boolean;
}

// 1단계: 백엔드 → VRM 표정 + 권장 강도
const BACKEND_TO_VRM: Record<BackendEmotion, EmotionMapping> = {
  happy:   { vrm: 'happy',     intensity: 0.9 },
  angry:   { vrm: 'angry',     intensity: 0.9 },
  sad:     { vrm: 'sad',       intensity: 0.8 },
  fear:    { vrm: 'surprised', intensity: 0.7 }, // 두려움 ≈ 약한 놀람
  tired:   { vrm: 'sad',       intensity: 0.5 }, // 피곤 ≈ 약한 슬픔
  default: { vrm: 'neutral',   intensity: 1.0 },
  talking: { vrm: 'neutral',   intensity: 0.0, isTalking: true },
};

// 한국어/영어 다양한 표현 → 백엔드 표준 키
const SYNONYMS: Record<string, BackendEmotion> = {
  // 한국어
  '기쁨': 'happy', '행복': 'happy', '즐거움': 'happy',
  '분노': 'angry', '화남': 'angry', '짜증': 'angry',
  '슬픔': 'sad', '우울': 'sad', '실망': 'sad',
  '두려움': 'fear', '공포': 'fear', '무서움': 'fear',
  '피곤': 'tired', '지침': 'tired', '졸림': 'tired',
  '중립': 'default', '평온': 'default', '담담': 'default',
  '말함': 'talking', '발화': 'talking',
  // 영어 변형
  joyful: 'happy', excited: 'happy', glad: 'happy',
  mad: 'angry', frustrated: 'angry', annoyed: 'angry',
  sorrow: 'sad', melancholy: 'sad',
  scared: 'fear', afraid: 'fear',
  exhausted: 'tired', sleepy: 'tired',
  neutral: 'default', calm: 'default',
  speaking: 'talking',
};

/**
 * 백엔드/LLM 의 다양한 emotion 표기를 표준 VRM 매핑 정보로 변환
 * @example
 *   mapBackendEmotion('happy')   → { vrm: 'happy', intensity: 0.9 }
 *   mapBackendEmotion('fear')    → { vrm: 'surprised', intensity: 0.7 }
 *   mapBackendEmotion('talking') → { vrm: 'neutral', intensity: 0, isTalking: true }
 *   mapBackendEmotion('unknown') → { vrm: 'neutral', intensity: 1.0 } (default)
 */
export function mapBackendEmotion(raw: string | undefined | null): EmotionMapping {
  if (!raw) return BACKEND_TO_VRM.default;
  const key = raw.toLowerCase().trim();

  if (key in BACKEND_TO_VRM) {
    return BACKEND_TO_VRM[key as BackendEmotion];
  }
  if (key in SYNONYMS) {
    return BACKEND_TO_VRM[SYNONYMS[key]];
  }
  return BACKEND_TO_VRM.default;
}

// 2단계: VRM 표준 표정 → 실제 모델의 expression key 후보
// VRoid Studio export(VRM 0.x)는 'joy'/'sorrow' 등 구버전 키 사용. 자동 감지 후 첫 매치 사용.
export const DEFAULT_VRM_KEY_CANDIDATES: Record<VrmEmotion, string[]> = {
  happy:     ['happy', 'joy', 'fun'],
  angry:     ['angry', 'anger'],
  sad:       ['sad', 'sorrow'],
  surprised: ['surprised', 'surprise'],
  neutral:   ['neutral'],
};
