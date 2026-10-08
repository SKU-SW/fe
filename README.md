# Live Buddy

**AI 캐릭터와 함께 방송을 진행하는 React · Electron 방송 보조 앱**

캐릭터 설정, 방송 대시보드, 음성 대화, OBS 오버레이를 하나의 앱에서 관리합니다. 이 저장소는 SKU-SW 팀 프로젝트의 프론트엔드와 데스크톱 연동 코드를 담고 있습니다.

[다운로드](https://github.com/SKU-SW/fe/releases) · [백엔드](https://github.com/SKU-SW/be) · [개발 시작](docs/DEVELOPMENT.md) · [구조](docs/ARCHITECTURE.md) · [문제 해결](docs/TROUBLESHOOTING.md)

## 사용 흐름

캐릭터 생성·선택 → 방송 연결 → 음성 입력 → AI 응답 재생 → 캐릭터·OBS 화면 반영

| 기능 | 구현 범위 |
| --- | --- |
| 인증·캐릭터 | 이메일 로그인·회원가입, 폼 검증, 캐릭터 CRUD 및 페르소나·외형 설정 |
| 방송 대시보드 | 대화 내역, 연결 상태, 방송·음성 제어 |
| 음성·캐릭터 | 로컬 STT 연동, WebSocket 응답 수신, TTS 재생 및 2D·3D 캐릭터 표현 |
| OBS | 투명 오버레이, 상태 동기화, 브라우저 소스 설정 연동 |
| 분석·기록 | 채팅 통계, 월별 방송 기록과 상세 조회 API 연동 |

브라우저에서는 웹 UI를 실행할 수 있습니다. 전역 단축키·로컬 STT·OBS 자동 연결은 Electron 환경이 필요하며, 인증·방송·통계에는 별도 백엔드가 필요합니다. 게임 설정 UI와 선제 반응 플레이스홀더는 완성된 게임·선제 반응 시스템으로 소개하지 않습니다.

## 담당 역할

프론트엔드 기여자: **[이정현 · LeeJJang1](https://github.com/LeeJJang1)**

- React 화면, Zustand 상태 관리, 폼 검증과 REST API 연동
- 페이지 이동과 독립된 방송·STT 서비스 구성
- WebSocket 음성 응답, PCM 재생 큐, 캐릭터 감정·립싱크 연결
- OBS 오버레이 및 Electron 실행·배포 환경 대응

백엔드는 [SKU-SW/be](https://github.com/SKU-SW/be)에서 관리합니다. 위 역할은 프론트엔드 저장소의 코드와 작성 커밋을 기준으로 하며, 백엔드·AI 시스템 전체 구현을 개인 기여에 포함하지 않습니다.

## 주요 기술 경험

1. **방송 실행과 화면 수명주기 분리** — STT와 WebSocket을 앱 전역 서비스로 옮겨 페이지 이동과 연결 관리를 분리했습니다. [관련 커밋](https://github.com/SKU-SW/fe/commit/77e79d876e43fec3d52952bc02c2f95d9247b8f6)
2. **음성·캐릭터 동기화** — PCM 음성 재생과 감정·입 모양 상태를 연결했습니다. [관련 커밋](https://github.com/SKU-SW/fe/commit/676f9d3e3a1dc64c4d00f67b40e30cb10328aebc)
3. **데스크톱 실행 환경 대응** — Vite·React Router 전환 및 macOS·Windows 배포 구성을 다뤘습니다. [관련 커밋](https://github.com/SKU-SW/fe/commit/9161eeea5db756c7d78db9247f2c7f358e4ba456)

## 기술 스택

React 19 · TypeScript · Vite 8 · React Router 7 · Zustand · Tailwind CSS 3 · React Hook Form · Zod · Axios · WebSocket · Chart.js · Three.js / VRM · Electron 33

## 실행

```bash
git clone https://github.com/SKU-SW/fe.git
cd fe/swproject
npm ci
cp .env.example .env.local
npm run dev
```

Electron 실행, 백엔드 주소, STT 준비 사항은 [개발 가이드](docs/DEVELOPMENT.md)를 참고하세요.

## 프로젝트 상태

- 버전: `swproject/package.json` 기준 0.1.20
- 빌드·린트의 실제 확인 결과와 미검증 범위: [검증 기준선](docs/BASELINE.md)
- 다음 개선 순서: [개발 가이드의 개선 순서](docs/DEVELOPMENT.md#개선-순서)
- 이전 배포 안내: [릴리스 문서](docs/releases/README.md)
