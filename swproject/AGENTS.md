# SKU-SW 에이전트 가이드

> 이 파일은 AI 에이전트(OpenCode 등)가 프로젝트를 효율적으로 이해하고 작업하기 위한 가이드입니다.

## 프로젝트 개요

**SKU-SW**: React + Electron 기반 AI 캐릭터 방송 관리 데스크톱 애플리케이션

- 프런트엔드: React 19.2.4 + React Router v7 + Zustand
- 백엔드: Spring Boot REST API (localhost:8080)
- 데스크톱: Electron v33
- 빌드: Vite v8

## 우선 참고 문서

- 루트 가이드: `../CLAUDE.md` (가장 압축적이며 최신 — 2026-05-19 보강)
- 추가 문서: `../docs/` (PROJECT_GUIDE.md, ARCHITECTURE.md, API_SPECIFICATIONS.md, DEVELOPMENT_GUIDE.md, UI_DESIGN.md, SPECIFICATIONS.md, features/)
- 캐릭터 대시보드 상세: `./docs/` (디자인 가이드, 비주얼 레퍼런스 등)
- 오버레이 관련: 루트의 `OBS_OVERLAY_*`, `OVERLAY_*`, `PHASE2_*` 파일들
- 충돌 시 실제 진실 원천: `package.json`, `src/**/*`, `electron/**/*`

## 아키텍처 개요

### 디렉토리 구조

```
src/
├── pages/              # 라우트 페이지 (10개: auth/Login,Signup + Dashboard,
│                       #   Character, ChatAnalysis, Proactive, Game, Safety,
│                       #   Settings, Stats, Overlay)
├── features/           # auth, character, dashboard, broadcast, stt
├── shared/             # types, stores, hooks, lib, constants
├── components/layouts/ # DashboardLayout, DashboardHeader, DashboardSidebar
├── styles/globals.css
├── App.tsx             # React Router 라우팅 (HashRouter)
└── main.tsx            # React 진입점

electron/
├── main.ts             # BrowserWindow + IPC 핸들러
├── preload.ts          # contextBridge로 렌더러 API 노출
├── preload.d.ts        # 타입 정의
├── obsManager.ts       # OBS 자동 셋업 / 투명 오버레이 동기화
└── stt_server.py       # Faster Whisper 기반 STT 데몬 (Python)
```

### 주요 특징

- **Feature-Based Architecture**: 핵심 기능(`auth`, `character`, `dashboard`, `broadcast`, `stt`)은 독립 디렉토리로 분리. 채팅 분석/안전/게임/스탯/설정/오버레이 등은 page-only 상태 — feature 폴더는 로직이 충분히 복잡해질 때만 분리.
- **HashRouter** (`BrowserRouter` 아님): Electron `file://` 호환을 위해 필수. 리다이렉트는 `window.location.hash = '#/login'` 형태.
- **Zustand + Persist**: 상태 관리 (localStorage 자동 저장)
- **React Hook Form + Zod**: 폼 처리 및 검증
- **Axios + JWT 인터셉터**: API 호출 및 토큰 자동 갱신 (401 큐 패턴)
- **React Router v7**: Declarative 라우팅
- **Electron 외부 프로세스 통합**: OBS Studio(매니저로 자동 제어), Python STT 데몬(spawn 관리)

## 코딩 컨벤션

### 명명 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일 (컴포넌트) | PascalCase | `LoginPage.tsx`, `AuthCard.tsx` |
| 파일 (API/훅/유틸) | camelCase | `authApi.ts`, `useLogin.ts` |
| 함수/변수 | camelCase | `loginUser()`, `handleSubmit` |
| 상수 | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| 타입/인터페이스 | PascalCase | `User`, `LoginRequest`, `AuthStore` |
| 커스텀 훅 | useXxx | `useLogin`, `useCharacter` |
| Zustand Store | useXxxStore | `useAuthStore`, `useCharacterStore` |

### 파일 상단 주석

모든 `.ts`, `.tsx` 파일 상단에 JSDoc 주석 추가:

```typescript
/**
 * @file 파일 설명
 * @created 작성 시기 (예: Sprint 1)
 * @dependsOn 의존성 경로 (예: src/shared/stores/authStore.ts)
 * @usedBy 사용처 (예: src/pages/auth/LoginPage.tsx)
 */
```

### 코드 스타일

- **들여쓰기**: 2칸 스페이스
- **따옴표**: 더블 쿼트 (`"`) 권장
- **세미콜론**: 필수
- **파일 끝**: 새 줄 (`\n`) 추가

### 함수 작성 패턴

```typescript
// ✅ API 함수 (src/features/auth/api/authApi.ts)
export async function loginEmail(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login/email`, data);
  return res.data;
}

// ✅ 커스텀 훅 (src/features/auth/hooks/useLogin.ts)
export function useLogin(): UseLoginReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsPending(true);
      setError(null);
      try {
        const response = await loginEmail(data);
        setAuth(response.user, response.accessToken, response.refreshToken);
        navigate('/dashboard');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [setAuth, navigate]
  );

  return { login, isPending, error };
}
```

### 상태 관리 (Zustand Store) 패턴

```typescript
// src/shared/stores/authStore.ts
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' } // localStorage 키
  )
);

// 사용 예시 (컴포넌트)
const user = useAuthStore((s) => s.user);
const setAuth = useAuthStore((s) => s.setAuth);
```

**규칙**:
- `persist` 미들웨어로 자동 localStorage 저장
- selector 함수로 필요한 상태만 구독
- 액션은 `set` 함수로 업데이트

### 에러 처리

```typescript
// ✅ 올바른 에러 처리
try {
  await someAsyncOperation();
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
}
```

## API 연동

### Axios 설정 (src/shared/lib/axios.ts)

- 자동 JWT 토큰 주입
- 401 Unauthorized 시 토큰 자동 갱신
- 토큰 갱신 실패 시 로그아웃

### API 함수 패턴

**위치**: `src/features/{featureName}/api/{featureName}Api.ts`

```typescript
const AUTH_BASE = '/api/v1/auth';

export async function loginEmail(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login/email`, data);
  return res.data;
}
```

## 주요 기능별 흐름

### 인증 (Auth)

**파일**:
- `src/features/auth/api/authApi.ts` - API 호출
- `src/features/auth/hooks/useLogin.ts` - 로그인 로직
- `src/features/auth/hooks/useSignup.ts` - 회원가입 로직
- `src/shared/stores/authStore.ts` - 인증 상태
- `src/shared/types/auth.ts` - 타입 정의

**흐름**:
1. LoginPage에서 `useLogin` 호출
2. `useLogin` → `loginEmail()` API 호출
3. 응답 → `authStore.setAuth()` 저장
4. 대시보드로 라우팅

### 캐릭터 관리 (Character)

**파일**:
- `src/features/character/api/characterApi.ts` - API
- `src/features/character/hooks/useCharacter.ts` - 단일 조회
- `src/features/character/hooks/useCharacters.ts` - 목록 조회
- `src/features/character/hooks/useCreateCharacter.ts` - 생성
- `src/features/character/hooks/useUpdateCharacter.ts` - 수정
- `src/features/character/hooks/useDeleteCharacter.ts` - 삭제
- `src/shared/stores/characterStore.ts` - 캐릭터 상태

### 방송 (Broadcast) — OBS 송출 흐름

**파일**:
- `src/features/broadcast/api/broadcastApi.ts`, `streamApi.ts` - 방송/스트림 API
- `src/features/broadcast/components/ObsGateModal.tsx` - OBS 실행 게이트 모달
- `src/features/broadcast/hooks/`:
  - `useObsLaunch.ts` - OBS 실행 (Electron `obsManager.ts` 호출)
  - `useStartBroadcast.ts`, `useTerminateBroadcast.ts` - 방송 시작/종료
  - `useStreamInfo.ts` - 스트림 메타데이터
  - `useStreamWS.ts` - 방송용 WebSocket (자동 복구)
  - `useTTSPlayer.ts` - TTS 음성 재생
  - `useViewerChatPolling.ts` - 시청자 채팅 폴링
- `src/shared/stores/broadcastNoticeStore.ts` - 방송 공지/상태
- `src/shared/types/broadcast.ts`, `broadcastWs.ts`, `stream.ts`
- `electron/obsManager.ts` - OBS 자동 제어

### STT (음성 → 텍스트)

**파일**:
- `src/features/stt/hooks/useSTT.ts` - 렌더러 측 훅
- `electron/stt_server.py` - **Faster Whisper 기반 STT 데몬** (Electron이 spawn 관리, WebSocket 또는 IPC로 텍스트 푸시)

### 오버레이 (OBS용 투명 오버레이)

**파일**:
- `src/pages/OverlayPage.tsx` - 독립 라우트 `/overlay` (DashboardLayout 미적용)
- `src/shared/stores/overlayStore.ts` - 오버레이 상태
- `src/shared/lib/overlayBridge.ts` - 메인 앱 ↔ 오버레이 브릿지
- `src/shared/types/overlay.ts`
- `electron/obsManager.ts` - OBS 자동 셋업 + 투명 윈도우 동기화

### 채팅 분석 (Chat Analysis)

**파일**:
- `src/pages/ChatAnalysisPage.tsx` - 페이지 (page-only, feature 폴더 없음)
- `src/shared/hooks/useWebSocket.ts` - WebSocket 통신
- `src/shared/types/chat.ts` - 채팅 타입

## 타입 정의

### Authentication Types (src/shared/types/auth.ts)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshRequest {
  refreshToken: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}
```

### Character Types (src/shared/types/character.ts)

캐릭터 정보, 방송 설정, 프리셋 타입 포함

### API Response Types (src/shared/types/api.ts)

공통 API 응답 포맷

## 라우팅 (React Router v7)

**정의** (src/App.tsx):

```typescript
<Routes>
  {/* Auth 라우트 */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  
  {/* Dashboard 라우트 */}
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/character" element={<CharacterPage />} />
    <Route path="/chat-analysis" element={<ChatAnalysisPage />} />
    {/* 기타 라우트... */}
  </Route>
  
  {/* 오버레이 */}
  <Route path="/overlay" element={<OverlayPage />} />
</Routes>
```

**프로그래매틱 네비게이션**:

```typescript
const navigate = useNavigate();
navigate('/dashboard'); // 이동
navigate(-1); // 뒤로 가기
```

## 환경 설정

### 환경변수 (.env.local)

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### 개발 명령어

```bash
npm run dev              # Vite + React 핫 리로드
npm run electron:dev    # Electron 앱 개발
npm run build           # 빌드
npm run lint            # 린트
```

## 주의사항

### 피해야 할 패턴

- ❌ Props drilling (상태는 Zustand Store 사용)
- ❌ 컴포넌트 내 직접 API 호출 (hooks 레이어 사용)
- ❌ localStorage 직접 접근 (Store persist 사용)
- ❌ 동기 에러 처리 없는 async/await

### 주의 사항

- 모든 async 함수는 try-catch로 에러 처리
- API 응답 타입 명시 필수
- Store 업데이트는 액션 함수로만 수행
- 파일 상단 JSDoc 주석 필수

## 새로운 기능 추가 체크리스트

1. **타입 정의** (src/shared/types/ 또는 src/features/{name}/)
2. **API 함수** (src/features/{name}/api/{name}Api.ts)
3. **커스텀 훅** (src/features/{name}/hooks/useXxx.ts)
4. **컴포넌트** (src/features/{name}/components/)
5. **라우트** (필요 시 src/App.tsx에 추가)
6. **상태 관리** (필요 시 Zustand Store 생성)
7. **파일 상단 JSDoc 주석** 추가

## 프로젝트 참고 자료

- **전체 가이드**: `/PROJECT_GUIDE.md`
- **추가 문서**: `/docs/`
- **환경변수**: `.env.example`

## 전체 스토어/타입 인덱스

**Zustand Stores** (`src/shared/stores/`):
- `authStore` — 사용자/토큰
- `characterStore` — 현재 선택된 캐릭터
- `characterSettingsStore` — 캐릭터 세부 설정
- `aiModeStore` — AI 모드
- `safetyStore` — 안전 검사 상태
- `broadcastNoticeStore` — 방송 공지/상태
- `overlayStore` — 오버레이 상태
- `themeStore` — 디스코드 테마 토큰

**Types** (`src/shared/types/`):
- `api` (공통 응답), `auth`, `character`, `chat`, `game`
- `broadcast`, `broadcastWs`, `stream` (방송)
- `overlay`

---

**마지막 업데이트**: 2026-05-19

**개발 타임라인**: 2026-04-14 시작 → 2026-04-29 CLAUDE.md 초안 → 2026-04-30 broadcast 추가 → 2026-05-10 Python STT 데몬 → 2026-05-11~12 OBS 오버레이 자동화 → 2026-05-19 본 문서 보강.

이 파일을 참고하여 프로젝트 코드 작성 및 수정을 진행하세요.
