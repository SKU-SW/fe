# SWproject

방송 채팅 분석 및 AI 캐릭터 관리 Electron 데스크톱 애플리케이션.

## 기술 스택

React 19 · TypeScript · Vite · Electron 33 · Zustand · React Hook Form + Zod · Tailwind CSS v3 · Axios · Chart.js. 백엔드는 Spring Boot REST API + WebSocket (`localhost:8080`).

> 프로젝트는 원래 Next.js로 시작되었다가 Electron 호환을 위해 Vite + React Router로 마이그레이션됨. 자세한 내용은 소스 곳곳의 `@migrated` 주석 및 `docs/superpowers/` 의 설계 문서 참조.

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env.local
# 필요 시 .env.local 의 VITE_API_BASE_URL, VITE_WS_URL 수정
```

## 개발

```bash
npm run dev              # Vite dev 서버 (http://localhost:5173)
npm run electron:dev     # Vite + Electron 동시 실행
npm run lint             # ESLint
```

`npm run dev`는 브라우저에서 확인할 때, `npm run electron:dev`는 데스크톱 앱으로 띄울 때 사용.

## 빌드

```bash
npm run build            # 웹 빌드 → dist/
npm run electron:build   # Electron 앱 패키징 → release/
npm run electron:preview # 프로덕션 모드 Electron 미리보기
```

## 환경변수 (`.env.local`)

```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

Vite 규칙상 클라이언트에 노출되는 환경변수는 `VITE_` 접두사 필수.

## 디렉토리 구조

```
src/
├── pages/        # 라우트별 페이지
├── features/     # 기능 모듈 (auth, character, dashboard)
├── shared/       # 공유 stores, types, hooks, lib
├── components/   # 글로벌 레이아웃
└── styles/       # 글로벌 스타일

electron/         # Electron 메인 프로세스 + preload
```

## 추가 문서

- 상위 디렉토리 (`../`) 의 `PROJECT_GUIDE.md`, `SPECIFICATIONS.md`,
  `API_SPECIFICATIONS.md`, `DEVELOPMENT_GUIDE.md`, `UI_DESIGN.md`
- `AGENTS.md` — AI 에이전트용 가이드
- `docs/superpowers/` — 설계/계획 문서 (마이그레이션 히스토리 포함)
