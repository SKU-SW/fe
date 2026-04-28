# SKU-SW

방송 채팅 분석 및 AI 캐릭터 관리 Electron 데스크톱 앱. 원래 Next.js였다가 Vite로 마이그레이션됨 (소스 곳곳의 `@migrated` 주석 참조).

코드는 `swproject/` 안에 있음. 모든 명령어는 `swproject/`에서 실행.

## 실제 기술 스택 (`swproject/package.json` 기준)

- **React** 19.2.4 + **react-router-dom** v7
- **TypeScript** v5
- **Vite** v8 (빌드/dev 서버 — port 5173)
- **Electron** v33 (contextIsolation 사용, preload 스크립트 통한 IPC만 허용)
- **Zustand** v5 (`persist` 미들웨어로 localStorage 자동 동기화)
- **react-hook-form** v7 + **Zod** v4 (`@hookform/resolvers`)
- **Tailwind CSS v3** + `@tailwindcss/forms` (PostCSS 방식 — v4 아님)
- **Axios** v1
- **Chart.js** v4 + **react-chartjs-2**
- **lucide-react**, **clsx**, **tailwind-merge**

백엔드: Spring Boot REST API @ `localhost:8080` + WebSocket `ws://localhost:8080`.

## 라우터: HashRouter

`src/main.tsx`에서 `BrowserRouter`가 아닌 **`HashRouter`** 사용 — Electron의 `file://` 프로토콜과 호환되어야 하기 때문. 라우터 변경 금지. 리다이렉트는 `window.location.hash = '#/login'` 형태로 작성.

## 디렉토리 구조 (`swproject/src/`)

```
pages/                 # 라우트 페이지 (auth/LoginPage, auth/SignupPage,
                       # DashboardPage, CharacterPage, ChatAnalysisPage,
                       # ProactivePage, GamePage, SafetyPage, StatsPage,
                       # OverlayPage)
features/              # 기능 모듈 — 현재 auth, character, dashboard만 존재
  auth/        → api/, components/, hooks/, schemas/
  character/   → api/, components/, hooks/
  dashboard/   → api/, hooks/
shared/
  lib/         → axios.ts, utils.ts
  stores/      → authStore, characterStore, aiModeStore, safetyStore
  hooks/       → useWebSocket.ts
  types/       → api, auth, character, chat, game
  constants/   → character.ts
components/layouts/    → DashboardLayout
styles/                # globals.css
App.tsx                # <Routes> 정의
main.tsx               # createRoot + HashRouter
```

`electron/main.ts` — Electron 메인 프로세스 (BrowserWindow, IPC 핸들러).

**중요**: 새 페이지를 만들 때 무조건 `features/{name}/` 디렉토리를 만들 필요는 없음. 위 페이지 중 다수는 page 컴포넌트만 있고 feature 폴더가 없는 상태. 로직이 충분히 복잡해질 때만 feature 폴더로 분리.

## TypeScript Path Alias

`@/*` → `./src/*` (`vite.config.ts`, `tsconfig.json`).

```ts
import { useAuthStore } from '@/shared/stores/authStore';
```

## API 클라이언트 (`src/shared/lib/axios.ts`)

두 개의 axios 인스턴스:

- **`apiClient`** (default export) — 일반 API 요청용. JWT 자동 주입 + 응답 unwrap + 401 시 토큰 재발급.
- **`bareClient`** (named export) — 토큰을 주입하지 않음. **refresh 엔드포인트 호출 전용** (refresh 요청에 만료 토큰이 붙으면 무한 루프).

핵심 동작:

1. **요청 인터셉터**: `accessToken`을 `Authorization: Bearer ...`로 주입. 단 `AUTH_PUBLIC_PATHS` (`/api/v1/auth/login`, `/register`, `/refresh`)는 토큰 주입 안 함 — 만료 토큰으로 로그인이 막히는 걸 방지.
2. **응답 unwrap**: 백엔드가 `{ success, data }` 또는 `{ status, data }` 형태로 감싸 보내면 `data`만 추출해서 반환.
3. **401 처리 (큐 패턴)**: 첫 401만 refresh 트리거하고 동시에 발생한 다른 401들은 `failedQueue`에 대기. refresh 성공하면 큐의 모든 요청을 새 토큰으로 재시도. 실패하면 `clearAuth()` + `#/login` 리다이렉트.

새 API 호출 작성 시 무조건 `apiClient` 사용. refresh를 직접 호출할 일 없음 (인터셉터가 처리).

## Zustand Store 규칙

- `persist({ name: 'xxx-storage' })`로 localStorage 자동 저장.
- 컴포넌트에선 selector로 필요한 필드만 구독: `useAuthStore((s) => s.user)`.
- 인터셉터 같은 비-React 코드에선 `useAuthStore.getState()` 사용.
- 상태 업데이트는 store에 정의한 액션으로만 (직접 `set` 호출 금지).
- localStorage 직접 접근 금지 — `persist` 미들웨어를 거칠 것.

## 폼: react-hook-form + Zod

```ts
const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type FormData = z.infer<typeof schema>;
const { register, handleSubmit, formState: { errors } } =
  useForm<FormData>({ resolver: zodResolver(schema) });
```

스키마는 `features/{name}/schemas/`에 모음.

## 명령어 (`swproject/`에서 실행)

```bash
npm run dev               # Vite dev 서버 (port 5173, strictPort)
npm run electron:dev      # Vite + Electron 동시 실행 (concurrently)
npm run build             # tsc -b && vite build → dist/
npm run electron:build    # Electron 앱 패키징 (electron-builder)
npm run electron:preview  # 프로덕션 모드 Electron 미리보기
npm run lint              # ESLint
```

## 환경변수

`swproject/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

⚠️ `process.env.NEXT_PUBLIC_*` 형태는 사용 금지. **`import.meta.env.VITE_*`** 사용 (Vite 규칙).

## 코딩 컨벤션

- **들여쓰기**: 2칸 스페이스
- **세미콜론**: 필수
- **파일명**: 컴포넌트는 `PascalCase.tsx`, 그 외는 `camelCase.ts`
- **타입/인터페이스**: `PascalCase`
- **훅/스토어**: `useXxx`, `useXxxStore`
- **상수**: `UPPER_SNAKE_CASE`
- **에러 캐치**: `catch (err: unknown)` 후 `instanceof Error` 체크

## 기능별 파일 위치

| 기능 | 위치 |
|------|------|
| 인증 | `features/auth/` (api, hooks, components, schemas) + `shared/stores/authStore.ts` + `shared/types/auth.ts` |
| 캐릭터 | `features/character/` + `shared/stores/characterStore.ts` + `shared/constants/character.ts` |
| 대시보드 | `features/dashboard/` (api, hooks) + `pages/DashboardPage.tsx` |
| 채팅 분석 | `pages/ChatAnalysisPage.tsx` + `shared/hooks/useWebSocket.ts` |
| 안전 검사 | `pages/SafetyPage.tsx` + `shared/stores/safetyStore.ts` |
| AI 모드 | `shared/stores/aiModeStore.ts` |

## 더 자세한 가이드

- `swproject/AGENTS.md` — 에이전트용 상세 가이드 (정상 문서)
- `PROJECT_GUIDE.md`, `SPECIFICATIONS.md`, `API_SPECIFICATIONS.md`,
  `DEVELOPMENT_GUIDE.md`, `UI_DESIGN.md` — 루트의 추가 문서

> 루트 문서는 약간 오래된 부분 있음 (Tailwind v4라고 적혀있는 등). 충돌 시 `package.json`과 실제 소스를 진실의 근원으로 삼을 것.
