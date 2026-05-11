# SKU-SW OBS 오버레이 구현 체크리스트 (한국어)

**작성일**: 2026년 5월 11일  
**상태**: 검증 완료 ✅  
**범위**: OBS Browser Source 오버레이 구현을 위한 필수 파일 및 위험 요소 분석

---

## 📋 1단계: 필수 파일 검증 (모두 ✅ 확인됨)

### 1.1 라우팅 및 진입점

| 파일 | 경로 | 상태 | 역할 | 위험도 |
|------|------|------|------|--------|
| **App.tsx** | `swproject/src/App.tsx:49` | ✅ | `/overlay` 라우트 정의 | 🟢 없음 |
| **main.tsx** | `swproject/src/main.tsx:9` | ✅ | HashRouter 설정 (Electron 호환) | 🟢 없음 |
| **OverlayPage.tsx** | `swproject/src/pages/OverlayPage.tsx` | ✅ | 오버레이 UI 컴포넌트 (88줄) | 🟡 낮음 |

**검증 결과**:
- ✅ HashRouter 사용 (Electron `file://` 프로토콜 호환)
- ✅ `/overlay` 라우트 독립적 (DashboardLayout 없음)
- ✅ 투명 배경 CSS (`bg-transparent`) 적용
- ⚠️ 현재 placeholder UI (감정 이미지 미구현)

---

### 1.2 상태 관리 (Zustand Stores)

| 파일 | 경로 | 상태 | 역할 | 위험도 |
|------|------|------|------|--------|
| **aiModeStore.ts** | `swproject/src/shared/stores/aiModeStore.ts` | ✅ | 방송 상태 (emotion, transcript, streamId) | 🟡 중간 |
| **characterStore.ts** | `swproject/src/shared/stores/characterStore.ts` | ✅ | 캐릭터 선택 상태 | 🟢 없음 |
| **authStore.ts** | `swproject/src/shared/stores/authStore.ts` | ✅ | 인증 토큰 (WebSocket 연결용) | 🟢 없음 |

**검증 결과**:
- ✅ `aiModeStore.currentEmotion` (StreamEmotion 타입)
- ✅ `aiModeStore.currentTranscript` (string)
- ✅ `aiModeStore.broadcastStreamId` (string | null)
- ✅ localStorage persist 미들웨어 적용
- ⚠️ **Gap**: `currentTranscript` 절대 업데이트 안 됨 (DashboardPage에서 설정 안 함)
- ⚠️ **Gap**: `currentEmotion` 항상 "default" (WebSocket에서 emotion 필드 없음)

**aiModeStore 필드 상세**:
```typescript
// 방송 세션 (broadcast start 응답)
broadcastStreamId: string | null;
broadcastStartedAt: string | null;

// 실시간 상태 (WebSocket 업데이트)
currentEmotion: StreamEmotion;        // "happy"|"sad"|"angry"|"crying"|"default"
currentTranscript: string;             // AI 응답 텍스트

// 대화 기록
dialogues: StreamDialogue[];
dialogueCursorId: number | null;
```

---

### 1.3 캐릭터 타입 및 API

| 파일 | 경로 | 상태 | 역할 | 위험도 |
|------|------|------|------|--------|
| **character.ts** (types) | `swproject/src/shared/types/character.ts` | ✅ | 캐릭터 DTO 정의 | 🟢 없음 |
| **broadcast.ts** (types) | `swproject/src/shared/types/broadcast.ts` | ✅ | 방송 API DTO 정의 | 🟢 없음 |
| **stream.ts** (types) | `swproject/src/shared/types/stream.ts` | ✅ | StreamEmotion, StreamDialogue 정의 | 🟢 없음 |
| **broadcastWs.ts** (types) | `swproject/src/shared/types/broadcastWs.ts` | ✅ | WebSocket 메시지 타입 | 🟢 없음 |
| **characterApi.ts** | `swproject/src/features/character/api/characterApi.ts` | ✅ | 캐릭터 API 호출 | 🟢 없음 |
| **broadcastApi.ts** | `swproject/src/features/broadcast/api/broadcastApi.ts` | ✅ | 방송 시작/종료 API | 🟢 없음 |
| **streamApi.ts** | `swproject/src/features/broadcast/api/streamApi.ts` | ✅ | 방송 정보/대화 API | 🟢 없음 |

**검증 결과**:
- ✅ `CharacterDetailResDto.characterImageUrl` 필드 존재
- ✅ `BroadcastCharacterInfoResDto.characterImageUrl` 필드 존재
- ✅ `StreamEmotion` 타입 정의 (5가지 상태)
- ✅ `StreamDialogue` 타입 정의 (emotion 필드 포함)
- ⚠️ **Gap**: `BroadcastStartResDto`에 캐릭터 정보 없음 (별도 fetch 필요)
- ⚠️ **Gap**: WebSocket 메타데이터에 emotion 필드 없음

---

### 1.4 훅 (Hooks)

| 파일 | 경로 | 상태 | 역할 | 위험도 |
|------|------|------|------|--------|
| **useCharacter.ts** | `swproject/src/features/character/hooks/useCharacter.ts` | ✅ | 단일 캐릭터 조회 | 🟢 없음 |
| **useStreamWS.ts** | `swproject/src/features/broadcast/hooks/useStreamWS.ts` | ✅ | WebSocket 클라이언트 | 🟡 중간 |
| **useStreamInfo.ts** | `swproject/src/features/broadcast/hooks/useStreamInfo.ts` | ✅ | 방송 정보 조회 | 🟢 없음 |
| **useStartBroadcast.ts** | `swproject/src/features/broadcast/hooks/useStartBroadcast.ts` | ✅ | 방송 시작 | 🟢 없음 |
| **useTerminateBroadcast.ts** | `swproject/src/features/broadcast/hooks/useTerminateBroadcast.ts` | ✅ | 방송 종료 | 🟢 없음 |

**검증 결과**:
- ✅ `useStreamWS` 훅 완전 구현 (재연결 로직, 에러 처리)
- ✅ WebSocket URL 자동 생성 (`VITE_WS_URL` 환경변수)
- ✅ Binary + Text 프레임 페어링 로직
- ⚠️ **Gap**: `onVoiceResponse` 콜백에서 `currentTranscript` 업데이트 안 함

---

### 1.5 API 클라이언트 및 인증

| 파일 | 경로 | 상태 | 역할 | 위험도 |
|------|------|------|------|--------|
| **axios.ts** | `swproject/src/shared/lib/axios.ts` | ✅ | JWT 자동 주입, 401 재발급 | 🟢 없음 |
| **authStore.ts** | `swproject/src/shared/stores/authStore.ts` | ✅ | 토큰 저장/갱신 | 🟢 없음 |

**검증 결과**:
- ✅ `apiClient` (JWT 주입) + `bareClient` (토큰 없음) 분리
- ✅ 요청 인터셉터: `Authorization: Bearer {token}` 자동 주입
- ✅ 응답 인터셉터: 401 → 토큰 재발급 → 재시도 (큐 패턴)
- ✅ `AUTH_PUBLIC_PATHS` 설정 (login/register/refresh 제외)
- ✅ localStorage persist (앱 재시작 시 토큰 유지)

---

### 1.6 환경 변수

| 변수 | 값 (dev) | 값 (prod) | 용도 | 위험도 |
|------|----------|-----------|------|--------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | `https://dev.sku-sw.cloud` | REST API | 🟢 없음 |
| `VITE_WS_URL` | `ws://localhost:8080` | `wss://dev.sku-sw.cloud` | WebSocket | 🟢 없음 |
| `VITE_IMAGE_BASE_URL` | `http://localhost:8080` | `https://dev-img.sku-sw.cloud` | 캐릭터 이미지 CDN | 🟢 없음 |

**검증 결과**:
- ✅ `.env.example` 템플릿 존재
- ✅ `.env.local` 개발 환경 설정 완료
- ✅ Vite `import.meta.env` 사용 (Next.js `process.env` 아님)
- ✅ 모든 환경변수 fallback 처리

---

### 1.7 Electron 설정

| 파일 | 경로 | 상태 | 역할 | 위험도 |
|------|------|------|------|--------|
| **main.ts** | `swproject/electron/main.ts:262-275` | ✅ | BrowserWindow 설정 | 🟡 중간 |

**검증 결과**:
- ✅ `titleBarStyle: 'hiddenInset'` (macOS 호환)
- ✅ `contextIsolation: true` (보안)
- ✅ `nodeIntegration: false` (보안)
- ⚠️ **Gap**: `transparent: true` 플래그 없음 (OBS 캡처 시 배경 포함 가능)
- ⚠️ **Gap**: `frame: false` 플래그 없음 (윈도우 프레임 표시될 수 있음)

---

### 1.8 문서

| 파일 | 경로 | 상태 | 내용 | 위험도 |
|------|------|------|------|--------|
| **OVERLAY.md** | `docs/features/OVERLAY.md` | ✅ | 오버레이 기능 문서 | 🟢 없음 |
| **OVERLAY_INTEGRATION_ANALYSIS.md** | `/OVERLAY_INTEGRATION_ANALYSIS.md` | ✅ | 상세 분석 문서 | 🟢 없음 |

**검증 결과**:
- ✅ 기본 문서 존재
- ✅ 데이터 소스 명시
- ⚠️ 구현 가이드 부족 (새로 작성됨)

---

## 🔴 2단계: 중대 위험 요소 (즉시 해결 필요)

### 위험 #1: Transcript 절대 업데이트 안 됨
**심각도**: 🔴 **CRITICAL**  
**파일**: `swproject/src/pages/DashboardPage.tsx:111-131`  
**문제**: 
```typescript
// ❌ 현재 코드 - voiceText가 dialogues에만 추가되고 currentTranscript는 업데이트 안 됨
const handleVoiceResponse = useCallback(
  ({ audio, voiceText, cursorId }: VoiceResponse) => {
    upsertDialogues([{ text: voiceText, ... }], cursorId);
    enqueueTTS(audio);
    // ❌ setCurrentTranscript(voiceText) 없음!
  },
  [upsertDialogues, enqueueTTS]
);
```

**영향**: OverlayPage에서 `currentTranscript` 항상 빈 문자열 표시  
**해결책**: 2줄 추가
```typescript
const setCurrentTranscript = useAIModeStore((s) => s.setCurrentTranscript);
// ...
setCurrentTranscript(voiceText);  // ← 추가
```

**예상 작업 시간**: 5분  
**테스트**: 방송 시작 → AI 응답 → OverlayPage에 텍스트 표시 확인

---

### 위험 #2: Emotion 항상 "default"
**심각도**: 🔴 **CRITICAL**  
**파일**: `swproject/src/shared/types/broadcastWs.ts:40-44`  
**문제**:
```typescript
// WebSocket 메타데이터에 emotion 필드 없음
export interface StreamWsVoiceMetadata {
  characterId: number;
  voiceText: string;
  broadcastDialogueCursorId: number;
  // ❌ emotion 필드 없음!
}
```

**영향**: OverlayPage 감정 박스 색상 절대 변경 안 됨  
**해결책**: 
- **옵션 A** (권장): 백엔드에서 emotion 필드 추가
- **옵션 B** (임시): characterPersona.personality로 추론
  ```typescript
  const emotionMap = {
    'ACTIVE': 'happy',
    'CALM': 'sad',
    'HUMOROUS': 'happy',
    'SERIOUS': 'angry',
  };
  ```

**예상 작업 시간**: 백엔드 1-2시간 / 프론트엔드 30분  
**테스트**: 방송 시작 → AI 응답 → OverlayPage 감정 박스 색상 변경 확인

---

### 위험 #3: 캐릭터 이미지 미표시
**심각도**: 🟠 **HIGH**  
**파일**: `swproject/src/pages/OverlayPage.tsx:46-87`  
**문제**:
```typescript
// ❌ 현재 코드 - 캐릭터 이미지 렌더링 없음
export default function OverlayPage() {
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  // ❌ characterImageUrl 가져오지 않음
  
  return (
    <div className="flex h-screen w-screen items-end justify-between bg-transparent p-6">
      <div className="pointer-events-none flex items-end gap-4">
        <div className={`flex h-72 w-72 items-end justify-center ...`}>
          {/* ❌ 이미지 없음, placeholder 텍스트만 표시 */}
          <p className="mt-1 text-sm text-white/80">감정 이미지 placeholder</p>
        </div>
```

**영향**: 오버레이에 캐릭터 아바타 표시 안 됨  
**해결책**: 15줄 추가
```typescript
import { useCharacterStore } from '@/shared/stores/characterStore';
import { useCharacter } from '@/features/character/hooks';

export default function OverlayPage() {
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  
  // ← 추가
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const { character } = useCharacter(selectedCharacterId);
  const characterImageUrl = character?.characterImageUrl;
  
  return (
    // ...
    {characterImageUrl && (
      <img 
        src={characterImageUrl} 
        alt="Character" 
        className="h-72 w-72 rounded-[28px] object-cover"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    )}
```

**예상 작업 시간**: 15분  
**테스트**: 방송 시작 → OverlayPage에 캐릭터 이미지 표시 확인

---

### 위험 #4: Electron 투명 설정 부족
**심각도**: 🟠 **HIGH**  
**파일**: `swproject/electron/main.ts:262-275`  
**문제**:
```typescript
// ❌ 현재 코드 - 투명 설정 없음
mainWindow = new BrowserWindow({
  width: 1280,
  height: 800,
  minWidth: 1024,
  minHeight: 768,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
  titleBarStyle: 'hiddenInset',
  show: false,
  // ❌ transparent: true 없음
  // ❌ frame: false 없음
});
```

**영향**: OBS 캡처 시 윈도우 프레임/배경 포함될 수 있음  
**해결책**: 3줄 추가
```typescript
mainWindow = new BrowserWindow({
  // ... 기존 옵션
  transparent: true,           // ← 추가
  frame: false,                // ← 추가
  webPreferences: {
    // ... 기존 옵션
    backgroundThrottling: false, // ← 추가 (OBS 캡처 시 성능)
  },
});
```

**예상 작업 시간**: 10분  
**테스트**: Electron 앱 실행 → OBS Browser Source 캡처 → 배경 투명 확인

---

## 🟡 3단계: 중간 위험 요소 (구현 전 검토)

### 위험 #5: WebSocket 기본 URL이 프로덕션
**심각도**: 🟡 **MEDIUM**  
**파일**: `swproject/src/features/broadcast/hooks/useStreamWS.ts:104-112`  
**문제**:
```typescript
const wsUrl = useMemo(() => {
  if (!accessToken || !broadcastStreamId) return null;
  const base = import.meta.env.VITE_WS_URL ?? "wss://dev.sku-sw.cloud";  // ← 프로덕션 기본값
  const params = new URLSearchParams({
    broadcastStreamId,
    accessToken,
  });
  return `${base}${WS_PATH}?${params.toString()}`;
}, [accessToken, broadcastStreamId]);
```

**영향**: 개발 환경에서 `.env.local` 설정 안 하면 프로덕션 서버 연결 시도  
**해결책**: `.env.local` 반드시 설정
```env
VITE_WS_URL=ws://localhost:8080
```

**예상 작업 시간**: 1분 (설정만)  
**테스트**: 개발 환경에서 WebSocket 연결 확인

---

### 위험 #6: 캐릭터 이미지 URL 해석 오류 가능성
**심각도**: 🟡 **MEDIUM**  
**파일**: `swproject/src/features/character/components/PNGTuberSelector.tsx:31-38`  
**문제**:
```typescript
const resolveAssetUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // 상대 경로인 경우 베이스 URL과 결합
  const base = imageBaseUrl.replace(/\/$/, ''); // trailing slash 제거
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};
```

**영향**: 
- 상대 경로 URL이 잘못 해석될 수 있음
- `VITE_IMAGE_BASE_URL` 설정 안 하면 빈 문자열 반환

**해결책**: 
1. `.env.local`에서 `VITE_IMAGE_BASE_URL` 반드시 설정
2. 백엔드에서 항상 절대 URL 반환하도록 요청

**예상 작업 시간**: 5분 (설정 확인)  
**테스트**: 캐릭터 이미지 로드 확인

---

### 위험 #7: 동시 방송 불가능
**심각도**: 🟡 **MEDIUM**  
**파일**: `swproject/src/features/broadcast/api/broadcastApi.ts:27-31`  
**문제**:
```typescript
export async function startBroadcast(characterId: number): Promise<BroadcastStartResDto> {
  const res = await apiClient.post<BroadcastStartResDto>(`${STREAM_BASE}/start`, null, {
    params: { characterId },
  });
  return res.data;
}
```

**영향**: 
- 한 사용자가 동시에 2개 이상 방송 시작 불가
- 백엔드에서 400 에러 반환 (이미 방송 중)

**해결책**: 
1. UI에서 방송 중 상태 확인 후 시작 버튼 비활성화
2. 에러 메시지 명확히 표시

**예상 작업 시간**: 이미 구현됨 (DashboardPage에서 mode 확인)  
**테스트**: 방송 중 다시 시작 시도 → 에러 메시지 표시 확인

---

### 위험 #8: 토큰 만료 시 자동 재발급 실패 가능성
**심각도**: 🟡 **MEDIUM**  
**파일**: `swproject/src/shared/lib/axios.ts:101-210`  
**문제**:
```typescript
// 401 처리 (큐 패턴)
// 첫 401만 refresh 트리거하고 동시 요청들은 큐에 대기
// refresh 실패 시 clearAuth() + 로그인 페이지 리다이렉트
```

**영향**: 
- 방송 중 토큰 만료 → WebSocket 연결 끊김
- 자동 재발급 실패 → 로그인 페이지로 강제 이동

**해결책**: 
1. 토큰 만료 시간 충분히 길게 설정 (백엔드)
2. 방송 중 토큰 자동 갱신 로직 추가 (프론트엔드)

**예상 작업 시간**: 1-2시간 (선택사항)  
**테스트**: 토큰 만료 시뮬레이션 → 자동 재발급 확인

---

## 🟢 4단계: 낮은 위험 요소 (선택사항)

### 위험 #9: 오버레이 URL 복사 기능 미지원 환경
**심각도**: 🟢 **LOW**  
**파일**: `swproject/src/pages/OverlayPage.tsx:38-44`  
**문제**:
```typescript
const copyOverlayUrl = async () => {
  try {
    await navigator.clipboard.writeText(overlayUrl);
  } catch {
    // clipboard 미지원 환경은 무시
  }
};
```

**영향**: 일부 구형 브라우저에서 URL 복사 실패  
**해결책**: 폴백 구현 (선택사항)
```typescript
const copyOverlayUrl = async () => {
  try {
    await navigator.clipboard.writeText(overlayUrl);
  } catch {
    // 폴백: input 선택 후 copy 명령
    const input = document.createElement('input');
    input.value = overlayUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
};
```

**예상 작업 시간**: 10분  
**테스트**: 구형 브라우저에서 URL 복사 확인

---

### 위험 #10: 감정 색상 대비 부족
**심각도**: 🟢 **LOW**  
**파일**: `swproject/src/pages/OverlayPage.tsx:20-26`  
**문제**:
```typescript
const EMOTION_CLASSES: Record<StreamEmotion, string> = {
  happy: "bg-yellow-500 border-yellow-600",    // 밝음
  sad: "bg-blue-500 border-blue-600",          // 중간
  angry: "bg-red-500 border-red-600",          // 밝음
  crying: "bg-cyan-500 border-cyan-600",       // 밝음
  default: "bg-slate-600 border-discord-dark", // 어두움
};
```

**영향**: 밝은 배경에서 텍스트 가독성 낮을 수 있음  
**해결책**: 텍스트 색상 명시적 설정 (선택사항)
```typescript
const EMOTION_CLASSES: Record<StreamEmotion, string> = {
  happy: "bg-yellow-500 border-yellow-600 text-gray-900",
  sad: "bg-blue-500 border-blue-600 text-white",
  angry: "bg-red-500 border-red-600 text-white",
  crying: "bg-cyan-500 border-cyan-600 text-gray-900",
  default: "bg-slate-600 border-discord-dark text-white",
};
```

**예상 작업 시간**: 5분  
**테스트**: 각 감정 상태에서 텍스트 가독성 확인

---

## 📊 5단계: 구현 우선순위 매트릭스

| 우선순위 | 위험 | 파일 | 작업 | 시간 | 영향 |
|---------|------|------|------|------|------|
| 🔴 P0 | #1 | DashboardPage.tsx | Transcript 업데이트 추가 | 5분 | 오버레이 텍스트 표시 |
| 🔴 P0 | #2 | broadcastWs.ts | Emotion 필드 추가 (백엔드) | 1-2h | 오버레이 감정 표시 |
| 🔴 P0 | #3 | OverlayPage.tsx | 캐릭터 이미지 렌더링 | 15분 | 오버레이 아바타 표시 |
| 🔴 P0 | #4 | electron/main.ts | 투명 설정 추가 | 10분 | OBS 캡처 품질 |
| 🟡 P1 | #5 | .env.local | WebSocket URL 설정 | 1분 | 개발 환경 연결 |
| 🟡 P1 | #6 | .env.local | 이미지 URL 설정 | 1분 | 캐릭터 이미지 로드 |
| 🟡 P2 | #7 | DashboardPage.tsx | 동시 방송 방지 UI | 이미 구현 | 사용자 경험 |
| 🟡 P2 | #8 | axios.ts | 토큰 자동 갱신 | 1-2h | 방송 중 연결 유지 |
| 🟢 P3 | #9 | OverlayPage.tsx | URL 복사 폴백 | 10분 | 호환성 |
| 🟢 P3 | #10 | OverlayPage.tsx | 텍스트 색상 개선 | 5분 | 가독성 |

---

## 🚀 6단계: 구현 체크리스트

### Phase 1: 최소 기능 (1-2시간)

- [ ] **Transcript 업데이트** (P0)
  - 파일: `swproject/src/pages/DashboardPage.tsx:111-131`
  - 작업: `setCurrentTranscript(voiceText)` 추가
  - 테스트: 방송 시작 → AI 응답 → 텍스트 표시 확인

- [ ] **캐릭터 이미지 렌더링** (P0)
  - 파일: `swproject/src/pages/OverlayPage.tsx:46-87`
  - 작업: `useCharacter()` 훅 추가, 이미지 렌더링
  - 테스트: 방송 시작 → 캐릭터 아바타 표시 확인

- [ ] **Electron 투명 설정** (P0)
  - 파일: `swproject/electron/main.ts:262-275`
  - 작업: `transparent: true`, `frame: false` 추가
  - 테스트: Electron 앱 실행 → OBS 캡처 → 배경 투명 확인

- [ ] **환경 변수 설정** (P1)
  - 파일: `swproject/.env.local`
  - 작업: `VITE_WS_URL`, `VITE_IMAGE_BASE_URL` 확인
  - 테스트: 개발 환경에서 연결 확인

### Phase 2: 감정 표시 (1-2시간, 백엔드 의존)

- [ ] **Emotion 필드 추가** (P0, 백엔드)
  - 파일: 백엔드 `StreamWsVoiceMetadata` DTO
  - 작업: `emotion: StreamEmotion` 필드 추가
  - 테스트: WebSocket 메타데이터에 emotion 포함 확인

- [ ] **Emotion 업데이트 로직** (P0, 프론트엔드)
  - 파일: `swproject/src/pages/DashboardPage.tsx:111-131`
  - 작업: `setEmotion(emotion)` 추가
  - 테스트: 방송 시작 → AI 응답 → 감정 박스 색상 변경 확인

### Phase 3: 폴리시 및 최적화 (1-2시간)

- [ ] **URL 복사 폴백** (P3)
  - 파일: `swproject/src/pages/OverlayPage.tsx:38-44`
  - 작업: 구형 브라우저 호환성 추가
  - 테스트: 구형 브라우저에서 URL 복사 확인

- [ ] **텍스트 색상 개선** (P3)
  - 파일: `swproject/src/pages/OverlayPage.tsx:20-26`
  - 작업: 감정별 텍스트 색상 명시
  - 테스트: 각 감정 상태에서 가독성 확인

- [ ] **토큰 자동 갱신** (P2, 선택사항)
  - 파일: `swproject/src/shared/lib/axios.ts`
  - 작업: 방송 중 토큰 자동 갱신 로직
  - 테스트: 토큰 만료 시뮬레이션 → 자동 갱신 확인

---

## 📝 7단계: 파일별 변경 사항 요약

### 필수 변경 (Phase 1)

#### 1. `swproject/src/pages/DashboardPage.tsx`
```diff
- const handleVoiceResponse = useCallback(
-   ({ audio, voiceText, cursorId }: VoiceResponse) => {
-     upsertDialogues([...], cursorId);
-     enqueueTTS(audio);
-   },
-   [upsertDialogues, enqueueTTS]
- );

+ const setCurrentTranscript = useAIModeStore((s) => s.setCurrentTranscript);
+ const handleVoiceResponse = useCallback(
+   ({ audio, voiceText, cursorId }: VoiceResponse) => {
+     upsertDialogues([...], cursorId);
+     setCurrentTranscript(voiceText);  // ← 추가
+     enqueueTTS(audio);
+   },
+   [upsertDialogues, setCurrentTranscript, enqueueTTS]
+ );
```

#### 2. `swproject/src/pages/OverlayPage.tsx`
```diff
+ import { useCharacterStore } from '@/shared/stores/characterStore';
+ import { useCharacter } from '@/features/character/hooks';

export default function OverlayPage() {
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);

+ const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
+ const { character } = useCharacter(selectedCharacterId);
+ const characterImageUrl = character?.characterImageUrl;

  return (
    <div className="flex h-screen w-screen items-end justify-between bg-transparent p-6">
      <div className="pointer-events-none flex items-end gap-4">
        <div className={`flex h-72 w-72 items-end justify-center overflow-hidden rounded-[28px] border p-6 text-white shadow-2xl ${EMOTION_CLASSES[currentEmotion]}`}>
+         {characterImageUrl && (
+           <img 
+             src={characterImageUrl} 
+             alt="Character" 
+             className="absolute inset-0 h-full w-full rounded-[28px] object-cover"
+             onError={(e) => { e.currentTarget.style.display = 'none'; }}
+           />
+         )}
          <div className="w-full rounded-2xl bg-black/25 px-4 py-3 text-center backdrop-blur-sm">
            {/* ... 기존 코드 ... */}
          </div>
        </div>
```

#### 3. `swproject/electron/main.ts`
```diff
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
+     backgroundThrottling: false,
    },
    titleBarStyle: 'hiddenInset',
+   transparent: true,
+   frame: false,
    show: false,
  });
```

---

## 🧪 8단계: 테스트 체크리스트

### 단위 테스트

- [ ] `OverlayPage` 렌더링 테스트
  - 감정 상태별 색상 확인
  - 캐릭터 이미지 로드 확인
  - Transcript 텍스트 표시 확인

- [ ] `aiModeStore` 업데이트 테스트
  - `setCurrentTranscript()` 호출 시 상태 변경 확인
  - `setEmotion()` 호출 시 상태 변경 확인
  - `setBroadcast()` 호출 시 초기화 확인

- [ ] `useStreamWS` 훅 테스트
  - WebSocket 연결 확인
  - Binary + Text 프레임 페어링 확인
  - 에러 처리 확인

### 통합 테스트

- [ ] 방송 시작 → 오버레이 표시
  - 감정 박스 표시 확인
  - 캐릭터 이미지 표시 확인
  - Broadcast ID 표시 확인

- [ ] AI 응답 수신 → 오버레이 업데이트
  - Transcript 텍스트 업데이트 확인
  - 감정 박스 색상 변경 확인 (Phase 2)
  - TTS 오디오 재생 확인

- [ ] 방송 종료 → 오버레이 초기화
  - 모든 상태 초기화 확인
  - 오버레이 URL 표시 확인

### E2E 테스트

- [ ] OBS Browser Source 통합
  - URL 입력: `http://localhost:5173/#/overlay`
  - 방송 시작 → OBS에서 오버레이 표시 확인
  - AI 응답 → OBS에서 실시간 업데이트 확인
  - 배경 투명도 확인

- [ ] 다중 브라우저 호환성
  - Chrome/Edge (Chromium)
  - Firefox
  - Safari (macOS)

---

## 📚 9단계: 참고 자료

### 핵심 파일 맵

**라우팅**:
- `swproject/src/App.tsx` - 라우트 정의
- `swproject/src/main.tsx` - HashRouter 설정

**상태 관리**:
- `swproject/src/shared/stores/aiModeStore.ts` - 방송 상태
- `swproject/src/shared/stores/characterStore.ts` - 캐릭터 상태
- `swproject/src/shared/stores/authStore.ts` - 인증 상태

**API 및 통신**:
- `swproject/src/shared/lib/axios.ts` - JWT 인터셉터
- `swproject/src/features/broadcast/api/broadcastApi.ts` - 방송 API
- `swproject/src/features/broadcast/api/streamApi.ts` - 스트림 API
- `swproject/src/features/broadcast/hooks/useStreamWS.ts` - WebSocket 클라이언트

**타입 정의**:
- `swproject/src/shared/types/stream.ts` - StreamEmotion, StreamDialogue
- `swproject/src/shared/types/broadcast.ts` - 방송 DTO
- `swproject/src/shared/types/broadcastWs.ts` - WebSocket 메시지

**UI 컴포넌트**:
- `swproject/src/pages/OverlayPage.tsx` - 오버레이 페이지
- `swproject/src/pages/DashboardPage.tsx` - 대시보드 (WebSocket 핸들러)

**Electron**:
- `swproject/electron/main.ts` - 윈도우 설정

**환경 설정**:
- `swproject/.env.example` - 환경변수 템플릿
- `swproject/.env.local` - 개발 환경 설정

**문서**:
- `docs/features/OVERLAY.md` - 오버레이 기능 문서
- `/OVERLAY_INTEGRATION_ANALYSIS.md` - 상세 분석 문서

---

## 🎯 10단계: 최종 체크리스트

### 구현 전 확인사항

- [ ] 모든 필수 파일 존재 확인 (1단계)
- [ ] 중대 위험 요소 이해 (2단계)
- [ ] 중간 위험 요소 검토 (3단계)
- [ ] 우선순위 매트릭스 검토 (5단계)
- [ ] 환경 변수 설정 완료 (`.env.local`)
- [ ] 백엔드 팀과 emotion 필드 추가 일정 조율

### 구현 중 확인사항

- [ ] Phase 1 모든 변경사항 적용
- [ ] 로컬 개발 환경에서 테스트
- [ ] 콘솔 에러 없음 확인
- [ ] WebSocket 연결 확인 (DevTools Network 탭)
- [ ] OBS Browser Source에서 오버레이 표시 확인

### 구현 후 확인사항

- [ ] 모든 테스트 케이스 통과
- [ ] 문서 업데이트 (OVERLAY.md)
- [ ] 코드 리뷰 완료
- [ ] 프로덕션 배포 전 스테이징 환경 테스트

---

## 📞 11단계: 문제 해결 가이드

### 문제: OBS에서 오버레이 표시 안 됨

**원인 1**: URL 오류
```
확인: http://localhost:5173/#/overlay 정확한지 확인
해결: 브라우저에서 직접 접속해서 작동 확인
```

**원인 2**: 방송 미시작
```
확인: aiModeStore.broadcastStreamId가 null인지 확인
해결: 대시보드에서 방송 시작 후 오버레이 확인
```

**원인 3**: 투명 배경 미설정
```
확인: Electron main.ts에서 transparent: true 설정 확인
해결: 설정 추가 후 Electron 앱 재시작
```

### 문제: Transcript 텍스트 표시 안 됨

**원인 1**: setCurrentTranscript 미호출
```
확인: DashboardPage.tsx에서 setCurrentTranscript 호출 확인
해결: 코드 추가 후 방송 시작 → AI 응답 확인
```

**원인 2**: WebSocket 연결 실패
```
확인: DevTools Network 탭에서 ws:// 연결 확인
해결: .env.local에서 VITE_WS_URL 설정 확인
```

### 문제: 캐릭터 이미지 로드 실패

**원인 1**: 이미지 URL 오류
```
확인: 브라우저 DevTools Console에서 이미지 URL 확인
해결: VITE_IMAGE_BASE_URL 설정 확인
```

**원인 2**: CORS 오류
```
확인: DevTools Console에서 CORS 에러 메시지 확인
해결: 백엔드에서 CORS 설정 확인
```

---

## 📊 12단계: 구현 진행 상황 추적

| 항목 | 상태 | 담당자 | 예상 완료 | 실제 완료 |
|------|------|--------|----------|----------|
| Transcript 업데이트 | ⬜ | FE | 5분 | |
| 캐릭터 이미지 렌더링 | ⬜ | FE | 15분 | |
| Electron 투명 설정 | ⬜ | FE | 10분 | |
| 환경 변수 설정 | ⬜ | DevOps | 1분 | |
| Emotion 필드 추가 | ⬜ | BE | 1-2h | |
| Emotion 업데이트 로직 | ⬜ | FE | 30분 | |
| 테스트 및 검증 | ⬜ | QA | 1-2h | |
| 문서 업데이트 | ⬜ | Tech Writer | 30분 | |

---

## 🎓 결론

**현재 상태**: ✅ 구현 준비 완료

모든 필수 파일이 존재하고 아키텍처가 검증되었습니다. 4가지 중대 위험 요소(P0)를 해결하면 OBS Browser Source 오버레이가 완전히 작동합니다.

**권장 일정**:
- **Phase 1 (P0)**: 1-2시간 (필수)
- **Phase 2 (P0, 백엔드 의존)**: 1-2시간 (권장)
- **Phase 3 (P2-P3)**: 1-2시간 (선택)

**총 예상 시간**: 3-6시간 (백엔드 포함)

---

**문서 버전**: 1.0  
**작성일**: 2026년 5월 11일  
**검증자**: Explorer (AI Analysis)  
**상태**: 검증 완료 ✅
