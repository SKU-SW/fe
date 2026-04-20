# SWproject Frontend Design Spec
**Date:** 2026-04-14  
**Author:** 이정현  
**Repository:** SKU-SW/fe  
**Status:** Approved

---

## 1. 프로젝트 개요

AI 동료 캐릭터 기반 스트리밍 보조 서비스의 프론트엔드.  
스트리머가 방송 중 AI 동료 캐릭터와 실시간 음성 대화를 하고, 채팅 여론 분석·게임 연동·선제 반응 등을 대시보드에서 제어하는 웹 애플리케이션.

---

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + @tailwindcss/forms |
| State Management | Zustand |
| API Communication | Axios |
| Auth | NextAuth v5 (Google OAuth2 + credentials provider → Spring Boot JWT 브릿지) |
| Chart | Chart.js + react-chartjs-2 |
| Form Validation | react-hook-form + zod |
| Icons | lucide-react |
| WebSocket | 브라우저 네이티브 WebSocket (shared/hooks/useWebSocket.ts) |

---

## 3. 전체 디렉토리 구조

```
SWproject/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── character/page.tsx
│   │   │   ├── chat-analysis/page.tsx
│   │   │   ├── proactive/page.tsx
│   │   │   ├── game/page.tsx
│   │   │   ├── safety/page.tsx
│   │   │   └── stats/page.tsx
│   │   ├── overlay/page.tsx
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── character/
│   │   ├── conversation/
│   │   ├── chat-analysis/
│   │   ├── reaction/
│   │   ├── proactive/
│   │   ├── game/
│   │   ├── safety/
│   │   ├── stats/
│   │   └── overlay/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   └── types/
│   └── styles/globals.css
├── public/characters/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. 페이지 & 기능 매핑

### 4.1 인증 (1~2번 기능)
- `/login` — 이메일 로그인 + 구글 OAuth2
- `/signup` — 이메일 회원가입 + 구글 OAuth2
- NextAuth v5 credentials provider로 Spring Boot JWT 연동
- JWT는 NextAuth 세션에 저장, Axios 인터셉터에서 자동 주입

### 4.2 대시보드 (`/dashboard`)
- AI 모드 상태 표시 (방송 중 | 공백 | 게임)
- AI 반응 전략 현황 (응원 | 일반 | 비판)
- WebSocket으로 실시간 데이터 push 수신
- 음성 입력 방식 제어 (자동인식 | PTT | 비활성화)
- AI 동작 On/Off (음성출력 | 무음 | 완전OFF)

### 4.3 AI 캐릭터 설정 (`/character`) — 3번 기능
탭 구성:
- **캐릭터 정보 탭**
  - 성별 선택 (남/여)
  - 이름 입력 (2~10글자) + 호출어 등록
  - 외형 프리셋 선택 (성별별 1개 데모)
  - 목소리 프리셋 선택 (성별별 1개 데모)
  - 말투 선택 (친근한 반말 | 깍듯한 존댓말 | 장난기 반말 | 방송용 과장체)
  - 성격 선택 (활발함 | 차분함 | 유머러스 | 진지함)
  - 페르소나 선택 (게임 특화 | 유머/예능 | 진중/집중 | 잡담/소통)
- **방송 설정 탭**
  - 채팅 선제 반응 민감도 (높음 | 보통 | 낮음)
  - 대화 공백 반응 빈도 (10초 ~ 120초)
  - TTS 속도 조절
  - TTS 음량 조절
- **프리셋 관리 탭**
  - 설정 프리셋 저장/불러오기/삭제

### 4.4 채팅 분석 (`/chat-analysis`) — 5번 기능
- 현재 여론 비율 파이 차트 (긍정 | 중립 | 부정)
- 여론 흐름 라인 그래프 (방송 시작부터 현재까지)
- 채팅 속도 통계 (개/분)
- 실시간 키워드 Top10 바 차트
- 채팅별 여론 태그 표시
- 필터링된 채팅 통계
- WebSocket으로 실시간 채팅 데이터 수신

### 4.5 선제 반응 설정 (`/proactive`) — 6, 7번 기능
- AI 반응 전략 방식 (자동 | 수동 - 응원/일반/비판)
- 중요 채팅 선제 반응 On/Off
- 대화 공백 선제 반응 On/Off
- 방송 상황 AI 모드 자동 전환 표시

### 4.6 게임 연동 (`/game`) — 8번 기능
- Riot Client 연동 상태 및 연결 패널
- 실시간 게임 현황 (챔피언 | KDA | 게임모드 | 골드 | CS | 진행 시간)
- 이벤트 트리거 On/Off (킬 | 데스 | 어시스트 | 멀티킬 | 오브젝트 | 승리 | 패배)
- AI 반응 속도 설정 (빠름 | 보통 | 느림)

### 4.7 안전 관리 (`/safety`) — 9번 기능
- 금지어 등록/삭제/조회 (채팅 입력 필터 / AI 응답 필터 구분)
- AI 응원|비판 반응 강도 슬라이더 (강하게 | 일반 | 가볍게)
- 비판 채팅 편승 강도 (완전 편승 | 일반 | 완전 비편승)

### 4.8 방송 통계 (`/stats`) — 10번 기능
- 날짜 선택 필터
- 방송 흐름 로그 (스트리머 발화 | AI 대화 | 채팅 AI 응답 | 게임 이벤트 AI 응답)
- CSV 다운로드

### 4.9 OBS 오버레이 (`/overlay`) — 독립 페이지
- 대시보드 레이아웃 없음 (사이드바/헤더 제거)
- AI 응답 시 캐릭터 이미지 표시
- AI 음성 출력 연동

---

## 5. 공통 모듈 설계

### Axios 인스턴스 (`shared/lib/axios.ts`)
- baseURL: `NEXT_PUBLIC_API_BASE_URL`
- 요청 인터셉터: NextAuth 세션의 JWT 자동 주입 (`Authorization: Bearer`)
- 응답 인터셉터: 401 → 자동 로그아웃 처리

### WebSocket 훅 (`shared/hooks/useWebSocket.ts`)
- 베이스 훅으로 연결/재연결/해제 공통 처리
- `useDashboardSocket`, `useChatAnalysisSocket`, `useGameSocket`이 이를 확장

### Zustand 스토어
- `authStore.ts` — 로그인 유저 정보, JWT
- `characterStore.ts` — 캐릭터 설정 전역 상태 (페이지 간 공유)
- `aiModeStore.ts` — AI 현재 모드 (방송 중 | 공백 | 게임)

---

## 6. 환경변수

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## 7. 브랜치 전략

```
main          ← 배포용 (직접 커밋 X)
  └── develop ← 개발 통합 브랜치 (PR 머지 대상)
        └── feat/{이름}/{기능}  ← 기능별 작업 브랜치
```

초기 세팅은 `main` 브랜치에 커밋 후 `develop` 브랜치 생성.

---

## 8. 개발 로드맵 (프론트엔드 기준)

| 주차 | 작업 |
|------|------|
| 1주차 | Next.js 초기 세팅, GitHub Organization 연결 |
| 2주차 | 대시보드/로그인/회원가입 페이지 퍼블리싱, 인증 API 연동 |
| 3주차 | AI 캐릭터 설정 페이지 퍼블리싱 & API 연동, STT 적용 |
| 4주차 | OBS 오버레이 구현 |
| 5주차 | 채팅 분석 페이지 (Chart.js), WebSocket 연동, 채팅 수집 모듈 |
| 6주차 | 선제 반응 설정 페이지 & API 연동 |
| 7주차 | 게임 연동 페이지, 안전 관리 페이지 |
| 8주차 | 응답 로그/방송 통계 페이지, 대시보드 실시간 완성 |
| 9주차 | UI/UX 버그 수정, E2E 테스트, 성능 최적화 |
| 10주차 | 발표 자료, 데모 시나리오, 최종 문서화 |

---

## 9. 미결 사항 (백엔드 협의 필요)

1. **NextAuth ↔ Spring Boot JWT 연동 방식** — credentials provider 브릿지 vs 순수 Axios + httpOnly Cookie
2. **WebSocket 프로토콜** — STOMP over WebSocket vs 순수 WebSocket
3. **STT 처리 위치** — 브라우저 Web Speech API vs Whisper API (1주차 파이프라인 테스팅 결과 반영)
4. **TTS 오디오 스트림** — 백엔드에서 오디오 바이너리 전송 방식 확인
