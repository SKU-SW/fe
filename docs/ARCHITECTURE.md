# 아키텍처

현재 main 코드의 구조와 데이터 흐름입니다. 실행 검증 범위는 [검증 기준선](BASELINE.md)을 참고하세요.

## 1. 프로젝트 범위

Live Buddy는 AI 캐릭터 설정, 방송 대시보드, 음성 대화, OBS 오버레이를 제공하는 Electron 데스크톱 애플리케이션입니다.

- 프론트엔드: 화면 구성, 사용자 입력, 상태 관리, API·WebSocket 연동
- Electron: 창·트레이·전역 단축키, IPC, 로컬 STT 및 OBS 연결
- 별도 백엔드: 인증, 방송 데이터, AI 응답과 통계 API

로컬 STT 실행 코드는 이 저장소에 포함되지만, 별도 백엔드와 AI 시스템 전체를 이 저장소의 구현으로 간주하지 않습니다.

## 2. 기술 구성

| 영역 | 기술과 용도 |
| --- | --- |
| 화면 | React 19, TypeScript |
| 라우팅·빌드 | React Router 7, HashRouter, Vite 8 |
| 스타일 | Tailwind CSS 3, 시맨틱 테마 토큰 |
| 상태 | Zustand, 필요한 설정의 persist 처리 |
| 입력 검증 | React Hook Form, Zod |
| 서버 통신 | Axios, WebSocket |
| 통계 | Chart.js, react-chartjs-2 |
| 캐릭터 | Three.js, @pixiv/three-vrm |
| 음성 | MediaRecorder, Web Audio API, Python STT 사이드카 |
| 데스크톱·배포 | Electron 33, electron-builder, GitHub Actions |

패키지의 실제 버전은 `swproject/package.json`과 lockfile을 기준으로 합니다.

## 3. 소스 구조와 책임

```text
swproject/
├── src/
│   ├── pages/       # 라우트별 화면 조합
│   ├── features/    # 기능별 API, 훅, 컴포넌트, 검증 스키마
│   ├── shared/      # 공통 타입, store, 유틸리티
│   ├── services/    # 앱 전역 방송·STT 실행 로직
│   ├── components/  # 레이아웃, AppInitializer 등
│   ├── styles/      # 공통 스타일
│   ├── App.tsx      # 라우트 정의
│   └── main.tsx     # React 진입점
└── electron/        # 메인 프로세스, preload, STT·OBS 연동
```

페이지는 화면과 이벤트를 조합하고, 기능 모듈은 API 호출과 UI 관련 로직을 담당합니다. 페이지 이동과 무관하게 유지해야 하는 실행 로직은 `services/`에서 관리합니다. 운영체제 기능은 preload의 IPC 인터페이스를 통해 접근합니다.

## 4. 주요 기능과 데이터 흐름

### 인증

1. 로그인·회원가입 화면에서 입력값을 검증합니다.
2. 인증 API 응답을 받아 인증 store에 저장합니다.
3. 공통 Axios 클라이언트가 일반 API 요청에 access token을 추가합니다.
4. 401 응답 시 토큰 재발급을 시도하고 대기 중인 요청을 재시도합니다.
5. 재발급 실패 시 인증 상태를 정리하고 로그인 화면으로 이동합니다.

재발급 요청은 별도의 Axios 클라이언트를 사용합니다. 동시 재발급을 조정하기 위해 진행 상태와 대기 큐를 사용합니다. 이는 구현 설명이며 모든 예외 경로를 검증했다는 의미는 아닙니다.

### 캐릭터·방송

캐릭터 생성·수정·삭제·선택을 API와 연결합니다. 선택된 캐릭터와 방송 상태는 store에서 관리하고, 방송 시작·종료 결과를 대시보드 및 전역 런타임에 반영합니다.

캐릭터 변경 이후 목록 갱신, 생성·수정 API의 빈 응답 처리, 이미지와 VRM 모델 판별 등 서버 응답과 화면 상태의 차이를 보정하는 작업이 포함됩니다.

### 음성 대화

```text
마이크 입력
  → MediaRecorder 녹음
  → Electron IPC
  → 로컬 STT 변환
  → 인식 텍스트를 방송 WebSocket으로 전송
  → 서버의 응답 텍스트·음성 수신
  → 대화 상태 갱신 및 음성 재생
  → 캐릭터·오버레이 상태 반영
```

`sttBackgroundService`는 녹음과 STT 요청을, `broadcastWSBackgroundService`는 방송 연결 및 메시지·TTS 처리를 관리합니다. 방송이 활성화되지 않은 상태에서는 인식 텍스트의 방송 전송을 건너뛰는 분기가 있습니다.

### TTS와 캐릭터 표현

수신한 PCM 음성을 AudioBuffer로 변환해 큐에 넣고 재생 시간을 예약합니다. AnalyserNode에서 얻은 주파수 데이터를 입 모양 가중치로 변환해 캐릭터 표현에 반영합니다. 음성 인식으로 정확한 음소를 추출하는 방식과는 구분됩니다.

2D 캐릭터는 감정별 이미지로, 3D 캐릭터는 VRM 모델과 표현 가중치로 표시합니다.

### OBS 오버레이

투명 `/overlay` 화면에 캐릭터와 대사를 표시합니다. 전역 런타임과 overlay store·bridge가 표시 상태를 연결합니다. Electron에는 로컬 오버레이 HTTP 서버와 OBS WebSocket v5 연결·브라우저 소스 설정 코드가 포함됩니다.

개발 환경의 오버레이 경로는 `http://localhost:5173/#/overlay`입니다. 패키징 환경에는 별도의 로컬 HTTP 제공 코드가 있으므로 개발 서버 주소를 배포 주소로 고정해서 사용하지 않습니다.

### 통계와 보조 화면

- 채팅 통계: 집계 간격·조회 범위를 API 요청에 전달
- 방송 기록: 월별 목록과 방송별 상세 조회 API 연결
- 금지어: 로컬 store 기반 추가·삭제·중복 방지
- 게임: 설정 화면 UI가 있으나 실제 게임 서버 연동 완료를 뜻하지 않음
- 선제 반응: 현재 페이지는 플레이스홀더이며 계획상 기능과 구분

## 5. 주요 설계 변경

### Next.js에서 Vite로 전환

Electron에서 정적 프론트엔드를 로드하는 구조에 맞춰 Vite와 React Router로 변경했습니다. Next.js 라우팅·환경변수 사용을 교체하고, Electron의 개발 서버와 빌드 결과물 경로를 수정했습니다.

현재는 `file://` 실행 환경을 고려해 HashRouter와 상대 asset 경로를 사용합니다. 과거 Next.js용 설정 문서를 현재 실행 지침으로 사용하지 않습니다.

### 페이지 수명주기와 방송 서비스 분리

대시보드에 종속되어 있던 STT·WebSocket 로직을 전역 서비스로 이동했습니다. `AppInitializer`에서 초기화하고 페이지의 훅은 호출과 상태 구독을 담당하도록 구성했습니다.

이 구조는 화면을 이동할 때 방송 실행 로직까지 함께 정리되는 문제를 다루기 위한 것입니다. 서비스 초기화·구독 해제·방송 종료 시 자원 정리를 함께 확인해야 합니다.

### 시청자 채팅 폴링 변경

대시보드에서 3초마다 수행하던 시청자 채팅 조회를 진입·활성 상태 변경 시 1회 조회하도록 수정했습니다. 반복 요청을 제거한 대신, 해당 조회만으로 지속적인 최신 채팅 갱신을 보장하지는 않습니다. 측정하지 않은 서버 부하 개선율은 기재하지 않습니다.

### 배포 환경 대응

macOS·Windows 설치 파일 생성 워크플로와 STT 번들 구성을 추가했습니다. 배포 과정에서 Windows 런타임·Python 패키지 누락, 한글 인코딩, WebSocket 인증·Origin 등 실행 환경 차이에 대응한 커밋이 있습니다.


## API 계약의 기준

REST 호출은 `swproject/src/features/*/api/`, 요청·응답 타입은 각 feature와 `shared/types/`, 방송 이벤트는 `shared/types/broadcastWs.ts`를 확인합니다. 코드만으로 서버 계약을 확정하지 않고 백엔드 Swagger와 대조합니다.

## 확장 시 유지할 경계

- HashRouter와 상대 asset 경로는 Electron 실행을 고려해 유지합니다.
- 앱 전역 서비스의 수명주기를 페이지 마운트와 다시 결합하지 않습니다.
- 연결 관리, 메시지 해석, TTS, 립싱크의 분리는 후속 작업이며 아직 완료하지 않았습니다.
- 상태 변경은 store 액션을 사용하고 필요한 값만 selector로 구독합니다.
- UI 스타일 기준은 `src/styles/globals.css`와 `tailwind.config.js`의 현재 테마 토큰입니다.
