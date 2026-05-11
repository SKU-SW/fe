# SKU-SW 아키텍처

## 한 줄 요약

SKU-SW는 **React + Vite + Electron** 프런트엔드에 **Spring Boot REST API + WebSocket** 백엔드, 그리고 **Python Faster Whisper STT 사이드카**를 붙인 데스크톱 앱입니다.

## 실제 기술 스택

- UI: React 19, React Router v7, Tailwind CSS v3
- 상태관리: Zustand
- 데이터 통신: Axios, WebSocket
- 데스크톱 셸: Electron 33
- 음성 처리: MediaRecorder + Electron IPC + Python STT daemon
- 백엔드: Spring Boot (`http://localhost:8080`)

## 주요 디렉터리

```text
swproject/
├── src/
│   ├── pages/              # 라우트 페이지
│   ├── features/           # 기능 모듈
│   ├── shared/             # 공통 store/type/lib/hook
│   ├── components/layouts/ # DashboardLayout, Header, Sidebar
│   ├── styles/             # globals.css
│   ├── App.tsx             # 라우팅 정의
│   └── main.tsx            # React 엔트리, HashRouter
└── electron/
    ├── main.ts             # Electron 메인 프로세스
    ├── preload.ts          # IPC 브리지
    └── stt_server.py       # 로컬 STT 서버
```

## 라우팅 구조

- 인증: `/login`, `/signup`
- 레이아웃 포함: `/dashboard`, `/character`, `/chat-analysis`, `/proactive`, `/game`, `/safety`, `/stats`
- 독립 오버레이: `/overlay`

`main.tsx`는 **HashRouter**를 사용합니다. Electron `file://` 환경 대응 때문에 `BrowserRouter`로 바꾸면 안 됩니다.

## 레이어 구조

### 1. Page
- 위치: `src/pages/*`
- 역할: 화면 조합, 훅 연결, 라우트 진입점

### 2. Feature
- 위치: `src/features/*`
- 역할: API, 훅, 기능 컴포넌트
- 실제 핵심 feature: `auth`, `character`, `dashboard`, `broadcast`, `stt`

### 3. Shared
- 위치: `src/shared/*`
- 역할: 공통 타입, store, axios, 상수, 범용 훅

### 4. Electron
- 위치: `electron/*`
- 역할: BrowserWindow, 권한 처리, IPC, STT sidecar 생명주기

## 핵심 런타임 흐름

### 인증
1. `LoginPage` / `SignupPage`
2. `features/auth/hooks/*`
3. `features/auth/api/authApi.ts`
4. `shared/stores/authStore.ts`
5. `DashboardLayout`에서 토큰 기반 가드

### API 요청
1. 모든 일반 요청은 `shared/lib/axios.ts`의 `apiClient` 사용
2. access token 자동 주입
3. 401 시 refresh queue 패턴으로 토큰 갱신
4. refresh 실패 시 인증 제거 후 `#/login` 이동

### 방송
1. `CharacterPage`에서 방송 시작/종료
2. `useStartBroadcast` / `useTerminateBroadcast`
3. `aiModeStore`에 `broadcastStreamId`, `mode` 저장
4. `DashboardPage`가 `useStreamInfo`, `useStreamWS`, `useSTT`, `useTTSPlayer` 연결

### STT
1. `useSTT`가 브라우저 마이크 입력 수집
2. audio buffer를 Electron IPC로 전달
3. `electron/main.ts`의 `STTManager`가 Python daemon과 통신
4. 변환 텍스트가 다시 프런트로 올라와 LLM/WS 파이프라인으로 전달

## 주요 store

- `authStore`: 사용자, access/refresh token
- `characterStore`: 선택된 캐릭터
- `aiModeStore`: 방송 상태, 대화, 토글, 감정, transcript
- `safetyStore`: 금지어 목록
- `broadcastNoticeStore`: 방송 시작 확인 모달 스킵 상태

## 주의할 점

- 일부 상위 문서는 실제 코드보다 오래되었습니다.
- `docs/UI_DESIGN.md`와 일부 설계 문서는 Next.js 시절 흔적이 남아 있습니다.
- `aiModeStore`에는 현재 UI에서 사용하지 않는 상태도 일부 남아 있어, 리팩토링 후보입니다.

## 현재 기준 권장 참조 순서

1. `swproject/package.json`
2. `swproject/src/**/*`
3. `swproject/AGENTS.md`
4. `docs/features/*.md`
