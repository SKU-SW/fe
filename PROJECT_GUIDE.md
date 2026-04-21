# SKU-SW 프로젝트 가이드

## 1. 프로젝트 개요

**SKU-SW**는 방송 채팅 분석 및 AI 캐릭터 관리 Electron 데스크톱 애플리케이션입니다.

### 핵심 기능
- **인증 관리**: 이메일 기반 회원가입/로그인
- **캐릭터 관리**: AI 캐릭터 정보 및 방송 설정 관리
- **채팅 분석**: 실시간 채팅 데이터 수집 및 분석
- **게임 모드**: 인터랙티브 게임 기능
- **대시보드**: 통계 및 분석 데이터 시각화
- **안전 검사**: 콘텐츠 안전성 모니터링
- **오버레이**: 방송 화면 상단 투명 오버레이

### 기술 스택

| 분야 | 기술 |
|------|------|
| **프런트엔드** | React 19.2.4, React Router v7 |
| **상태 관리** | Zustand v5.0.12 (persist middleware) |
| **폼 처리** | React Hook Form v7.72.1 + Zod v4.3.6 |
| **UI/스타일** | Tailwind CSS v4 + Tailwind Merge |
| **API 통신** | Axios v1.15.0 |
| **차트** | Chart.js v4.5.1 + react-chartjs-2 |
| **아이콘** | Lucide React v1.8.0 |
| **데스크톱** | Electron v33.3.1 |
| **빌드 도구** | Vite v8.0.9 |
| **백엔드** | Spring Boot (REST API @ localhost:8080) |
| **통신** | WebSocket (ws://localhost:8080) |

---

## 2. 프로젝트 구조

```
swproject/
├── src/
│   ├── pages/                    # 페이지 컴포넌트 (라우트별)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CharacterPage.tsx
│   │   ├── ChatAnalysisPage.tsx
│   │   ├── ProactivePage.tsx
│   │   ├── GamePage.tsx
│   │   ├── SafetyPage.tsx
│   │   ├── StatsPage.tsx
│   │   └── OverlayPage.tsx
│   │
│   ├── features/                 # 기능별 모듈 (Feature-based Architecture)
│   │   ├── auth/
│   │   │   ├── api/              # API 호출 함수
│   │   │   │   └── authApi.ts
│   │   │   ├── components/       # 컴포넌트
│   │   │   │   ├── AuthCard.tsx
│   │   │   │   └── GoogleButton.tsx
│   │   │   ├── hooks/            # 커스텀 훅
│   │   │   │   ├── useLogin.ts
│   │   │   │   ├── useSignup.ts
│   │   │   │   ├── useLogout.ts
│   │   │   │   ├── useRefreshToken.ts
│   │   │   │   └── index.ts
│   │   │   └── schemas/          # Zod 스키마
│   │   │       └── authSchemas.ts
│   │   │
│   │   ├── character/            # 캐릭터 관리
│   │   │   ├── api/
│   │   │   │   └── characterApi.ts
│   │   │   ├── components/
│   │   │   │   ├── broadcast/   # 방송 설정
│   │   │   │   ├── info/        # 캐릭터 정보
│   │   │   │   └── preset/      # 프리셋 관리
│   │   │   └── hooks/
│   │   │       ├── useCharacter.ts
│   │   │       ├── useCharacters.ts
│   │   │       ├── useCreateCharacter.ts
│   │   │       ├── useUpdateCharacter.ts
│   │   │       ├── useDeleteCharacter.ts
│   │   │       ├── useSelectCharacter.ts
│   │   │       ├── useCharacterSettings.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── chat-analysis/       # 채팅 분석
│   │   ├── conversation/        # 대화 관리
│   │   ├── dashboard/           # 대시보드
│   │   ├── game/                # 게임 모드
│   │   ├── overlay/             # 오버레이
│   │   ├── proactive/           # 프로액티브 기능
│   │   ├── reaction/            # 반응 관리
│   │   ├── safety/              # 안전 검사
│   │   └── stats/               # 통계
│   │
│   ├── shared/                   # 공유 리소스
│   │   ├── types/               # 타입 정의
│   │   │   ├── auth.ts          # 인증 타입
│   │   │   ├── character.ts     # 캐릭터 타입
│   │   │   ├── chat.ts          # 채팅 타입
│   │   │   ├── game.ts          # 게임 타입
│   │   │   └── api.ts           # API 응답 타입
│   │   ├── stores/              # Zustand 상태 관리
│   │   │   ├── authStore.ts     # 인증 상태
│   │   │   ├── characterStore.ts # 캐릭터 상태
│   │   │   └── aiModeStore.ts   # AI 모드 상태
│   │   ├── hooks/               # 공유 훅
│   │   │   └── useWebSocket.ts
│   │   ├── lib/                 # 유틸리티
│   │   │   ├── axios.ts         # Axios 설정 + JWT 인터셉터
│   │   │   └── utils.ts         # 헬퍼 함수
│   │   └── components/          # 공유 컴포넌트
│   │
│   ├── components/              # 글로벌 컴포넌트
│   │   └── layouts/
│   │       └── DashboardLayout.tsx
│   │
│   ├── styles/                  # 글로벌 스타일
│   │
│   ├── App.tsx                  # 라우팅 정의
│   └── main.tsx                 # React 진입점
│
├── electron/                    # Electron 메인 프로세스
│   └── main.ts
│
├── dist-electron/               # 컴파일된 Electron 코드
├── public/                      # 정적 자산
├── docs/                        # 추가 문서
│
├── package.json
├── tsconfig.json               # TypeScript 설정
├── tsconfig.electron.json      # Electron용 TS 설정
├── tsconfig.node.json
├── vite.config.ts              # Vite 설정
├── eslint.config.mjs           # ESLint 설정
├── .env.example                # 환경변수 예시
└── README.md

```

### 핵심 파일 설명

| 파일 | 역할 |
|------|------|
| `src/App.tsx` | React Router 라우팅 정의 |
| `src/main.tsx` | React 진입점 |
| `src/shared/lib/axios.ts` | API 클라이언트 설정 (JWT 토큰 자동 주입/갱신) |
| `src/shared/stores/authStore.ts` | 인증 상태 관리 (localStorage persist) |
| `src/shared/stores/characterStore.ts` | 캐릭터 상태 관리 |
| `electron/main.ts` | Electron 메인 프로세스 |

---

## 3. 환경 설정

### 3.1 필수 요구사항
- **Node.js**: v18+ 이상
- **npm**: v9+ 이상
- **Spring Boot 백엔드**: localhost:8080에서 실행 중

### 3.2 설치

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
```

### 3.3 환경변수 (.env.local)

```env
# Spring Boot Backend API
VITE_API_BASE_URL=http://localhost:8080

# WebSocket URL
VITE_WS_URL=ws://localhost:8080
```

### 3.4 개발 시작

```bash
# Vite + React 핫 리로드 개발
npm run dev

# Electron 데스크톱 앱 개발 (별도 터미널)
npm run electron:dev

# 빌드
npm run build

# Electron 앱 빌드
npm run electron:build

# 린트 검사
npm run lint
```

---

## 4. 코딩 컨벤션 및 패턴

### 4.1 디렉토리 구조 규칙

**Feature-based Architecture** 원칙:
- 각 기능은 `src/features/{featureName}/` 하위에 자체 포함
- 관련 `api/`, `components/`, `hooks/`, `schemas/` 폴더 포함
- 기능 간 의존성은 최소화 (공유 타입/상태는 `shared/`에 배치)

**페이지 라우팅**:
- 모든 페이지 컴포넌트는 `src/pages/` 배치
- `src/App.tsx`에서 라우트 정의
- 페이지는 여러 `features/` 컴포넌트 조합

### 4.2 명명 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| **변수/함수** | camelCase | `loginUser`, `fetchCharacterData` |
| **상수** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| **파일명** | PascalCase (컴포넌트), camelCase (유틸) | `LoginPage.tsx`, `authApi.ts` |
| **타입/인터페이스** | PascalCase | `User`, `LoginRequest`, `AuthResponse` |
| **커스텀 훅** | useXxx | `useLogin`, `useCharacter`, `useWebSocket` |
| **Store (Zustand)** | useXxxStore | `useAuthStore`, `useCharacterStore` |

### 4.3 코드 스타일

**TypeScript/React**:
```tsx
// ✅ 좋은 예
import type { User } from '@/shared/types/auth';

/**
 * @file 로그인 페이지
 * @dependsOn useLogin, useAuthStore
 * @usedBy src/App.tsx
 */
export default function LoginPage() {
  const { login, isPending, error } = useLogin();
  
  const handleSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
  
  return (
    <div className="flex items-center justify-center">
      {/* JSX */}
    </div>
  );
}
```

**주석 규칙**:
- 파일 상단에 `@file`, `@dependsOn`, `@usedBy` JSDoc 주석
- 복잡한 로직에만 인라인 주석 추가
- 함수/타입은 JSDoc 블록 주석

**들여쓰기**: 2칸 스페이스

**따옴표**: 더블 쿼트 (`"`) 권장

### 4.4 상태 관리 패턴 (Zustand)

```typescript
// ✅ Store 정의 예시 (src/shared/stores/authStore.ts)
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

// ✅ 사용 예시 (컴포넌트)
const user = useAuthStore((s) => s.user);
const setAuth = useAuthStore((s) => s.setAuth);
```

**규칙**:
- `persist` 미들웨어로 localStorage 자동 저장
- selector 함수로 필요한 상태만 선택
- 액션은 `set` 함수로 상태 업데이트

### 4.5 API 호출 패턴

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
        const message = err instanceof Error ? err.message : 'Error';
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

**규칙**:
- API 함수는 `features/{name}/api/` 배치
- 커스텀 훅에서 로딩/에러 상태 관리
- Promise 반환 타입 명시
- 에러는 try-catch로 처리

### 4.6 폼 처리 패턴 (React Hook Form + Zod)

```typescript
// ✅ Zod 스키마 (src/features/auth/schemas/authSchemas.ts)
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ✅ 폼 컴포넌트에서 사용
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/features/auth/schemas/authSchemas';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

### 4.7 Axios 설정 및 JWT 인터셉터

**src/shared/lib/axios.ts**:
```typescript
// ✅ 자동 JWT 토큰 주입 및 갱신
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 Unauthorized 시 토큰 갱신
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      try {
        const newTokens = await refreshAccessToken({ refreshToken });
        useAuthStore.getState().setTokens(newTokens.accessToken, newTokens.refreshToken);
        // 원래 요청 재시도
        return apiClient(error.config);
      } catch (err) {
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**규칙**:
- 모든 API 요청은 `apiClient` 사용
- JWT 토큰은 Authorization 헤더에 자동 주입
- 401 에러 시 토큰 자동 갱신 및 재시도
- 토큰 갱신 실패 시 로그아웃 처리

### 4.8 에러 처리

```typescript
// ✅ 에러 타입 검사
try {
  await someAsyncOperation();
} catch (err: unknown) {
  // unknown 타입으로 캐치하고 instanceof 확인
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
}

// ✅ API 에러 응답
interface ApiErrorResponse {
  status: number;
  message: string;
  details?: Record<string, string>;
}
```

---

## 5. 주요 기능별 아키텍처

### 5.1 인증 (Auth)

**흐름**:
1. 사용자가 LoginPage/SignupPage에서 폼 제출
2. `useLogin`/`useSignup` 훅 호출
3. `authApi.ts`의 `loginEmail`/`registerEmail` 함수로 API 요청
4. 응답 받으면 `authStore`에 사용자 정보 + 토큰 저장
5. localStorage에 자동 persist (Zustand persist 미들웨어)
6. 대시보드로 라우팅

**파일**:
- `src/features/auth/api/authApi.ts` - API 함수
- `src/features/auth/hooks/useLogin.ts` - 로그인 로직
- `src/features/auth/hooks/useSignup.ts` - 회원가입 로직
- `src/shared/stores/authStore.ts` - 인증 상태
- `src/shared/types/auth.ts` - 타입 정의

### 5.2 캐릭터 관리 (Character)

**흐름**:
1. CharacterPage에서 캐릭터 목록 조회 (`useCharacters` 훅)
2. 캐릭터 선택 시 `useSelectCharacter` 호출
3. 캐릭터 정보 + 방송 설정을 `characterStore`에 저장
4. 설정 수정 시 `useUpdateCharacter` 호출해 API 업데이트
5. 새 프리셋 생성 시 `useCreateCharacter` → store에 `addPreset` 추가

**파일**:
- `src/features/character/api/characterApi.ts` - API 함수
- `src/features/character/hooks/useCharacter.ts` - 단일 캐릭터 조회
- `src/features/character/hooks/useCharacters.ts` - 캐릭터 목록
- `src/features/character/hooks/useCreateCharacter.ts` - 생성
- `src/features/character/hooks/useUpdateCharacter.ts` - 수정
- `src/features/character/hooks/useDeleteCharacter.ts` - 삭제
- `src/shared/stores/characterStore.ts` - 캐릭터 상태

### 5.3 채팅 분석 (Chat Analysis)

**구성**:
- 실시간 채팅 데이터 수집
- WebSocket으로 메시지 수신 (`src/shared/hooks/useWebSocket.ts`)
- 수신 메시지를 분석 및 통계 업데이트

**파일**:
- `src/features/chat-analysis/` - 채팅 분석 컴포넌트
- `src/shared/hooks/useWebSocket.ts` - WebSocket 훅

### 5.4 라우팅 (React Router v7)

**정의** (src/App.tsx):
```typescript
<Routes>
  {/* Auth 라우트 */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  
  {/* Dashboard 라우트 (DashboardLayout 포함) */}
  <Route element={<DashboardLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/character" element={<CharacterPage />} />
    {/* 기타 라우트... */}
  </Route>
  
  {/* 오버레이 (독립 라우트) */}
  <Route path="/overlay" element={<OverlayPage />} />
</Routes>
```

**네비게이션**:
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard'); // 이동
navigate(-1); // 뒤로 가기
```

---

## 6. 타입 정의

### 6.1 Authentication Types (src/shared/types/auth.ts)

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

interface SignupRequest {
  email: string;
  password: string;
  name: string;
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

### 6.2 Character Types (src/shared/types/character.ts)

캐릭터 정보, 방송 설정, 프리셋 타입 포함

### 6.3 API Response Types (src/shared/types/api.ts)

공통 API 응답 포맷

---

## 7. 자주하는 작업

### 7.1 새 페이지 추가

1. `src/pages/NewPage.tsx` 생성
2. `src/App.tsx`에 라우트 추가
3. 필요 시 `src/features/newFeature/` 디렉토리 생성

### 7.2 새 API 엔드포인트 연동

1. 타입 정의: `src/shared/types/` 또는 `src/features/{name}/`
2. API 함수: `src/features/{name}/api/{name}Api.ts`
3. 커스텀 훅: `src/features/{name}/hooks/useXxx.ts`
4. 컴포넌트에서 훅 사용

### 7.3 전역 상태 추가

1. `src/shared/stores/` 에 새 Store 파일 생성
2. Zustand `create`로 Store 정의 + `persist` 미들웨어 추가
3. 컴포넌트에서 Store 호출

### 7.4 컴포넌트 생성

```typescript
// src/features/{name}/components/XxxComponent.tsx
import { FC } from 'react';

interface XxxComponentProps {
  title: string;
  onClose?: () => void;
}

export const XxxComponent: FC<XxxComponentProps> = ({ title, onClose }) => {
  return (
    <div className="...">
      {title}
    </div>
  );
};

export default XxxComponent;
```

---

## 8. 주의사항

### 8.1 피해야 할 패턴

- ❌ 컴포넌트 간 직접 props drilling (상태는 Store 사용)
- ❌ API 호출을 컴포넌트 내 직접 작성 (hooks/api 레이어 사용)
- ❌ localStorage 직접 접근 (Zustand persist 사용)
- ❌ 동기 에러 처리 없는 async/await 사용

### 8.2 성능 최적화

- `useCallback`로 이벤트 핸들러 메모이제이션
- Zustand selector로 필요한 상태만 구독
- 큰 리스트는 가상화 고려 (react-window 등)

### 8.3 브라우저 호환성

- 최신 Chrome/Firefox/Safari 지원
- IE는 지원하지 않음

### 8.4 Spring Boot 백엔드 요구사항

- POST /api/v1/auth/login/email
- POST /api/v1/auth/register/email
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- Character, Chat Analysis 관련 엔드포인트
- WebSocket 엔드포인트

---

## 9. 유용한 명령어

```bash
# 개발
npm run dev               # Vite 핫 리로드
npm run electron:dev     # Electron 앱 개발
npm run lint             # ESLint 검사
npm run build            # 프로덕션 빌드
npm run electron:build   # Electron 앱 빌드
npm run preview          # 빌드 결과 미리보기
```

---

## 10. 추가 문서

- [`SPECIFICATIONS.md`](/SPECIFICATIONS.md) - 📋 기능 명세서 (전체 기능 정의)
- [`AGENTS.md`](/swproject/AGENTS.md) - 🤖 AI 에이전트 최적화 가이드
- `/docs/` - 추가 기술 문서
- `.env.example` - 환경변수 템플릿
- `package.json` - 의존성 및 스크립트

---

## 11. 연락처 및 도움말

프로젝트 구조나 코딩 컨벤션에 대한 질문은 이 가이드를 참조하세요.
기능 구현에 대한 상세 명세는 `SPECIFICATIONS.md`를 참조하세요.
