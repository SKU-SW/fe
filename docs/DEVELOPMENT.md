# 개발 가이드

## 준비

- Node.js와 npm: 이번 로컬 검증은 Node 25.9.0 / npm 11.12.1에서 수행했습니다. 배포 CI는 Node 20을 사용하므로 같은 결과를 보장하지 않습니다. 다음 단계에서 공통 지원 버전을 고정합니다.
- 백엔드: [SKU-SW/be](https://github.com/SKU-SW/be)의 실행 안내를 따릅니다.
- Electron 음성 기능: 마이크 및 운영체제 권한이 필요합니다.
- OBS 기능: OBS와 WebSocket 서버 설정이 필요합니다.
- STT 패키징: Python 3.11 또는 3.12 환경을 준비합니다. 활성 배포 워크플로는 3.11을 사용합니다.

## 설치와 실행

저장소 루트에서 다음을 실행합니다.

```bash
cd swproject
npm ci
cp .env.example .env.local
```

`.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_IMAGE_BASE_URL=http://localhost:8080
```

개발 중 REST 요청은 Vite의 `/api` 프록시를 사용합니다. Vite 환경변수는 클라이언트에 포함되므로 비밀키를 넣지 않습니다.

```bash
npm run dev                 # 브라우저 UI, localhost:5173
npm run electron:dev        # Vite와 Electron 함께 실행
npm run build               # 프론트 TypeScript 검사와 Vite 빌드
npm run electron:build-main # Electron TypeScript 컴파일
npm run lint                # ESLint
```

`dev`와 `electron:dev`는 같은 5173 포트를 쓰므로 동시에 별도로 실행하지 않습니다. 설치 명령 성공만으로 방송·음성 기능의 동작을 확인한 것은 아닙니다.

## STT와 패키징

`npm run stt:build`는 가상환경 생성, Python 의존성 설치, 모델 다운로드와 PyInstaller 빌드를 수행합니다. macOS에서는 스크립트가 찾는 `python3` 버전을 확인하고, Windows에서는 `py -3.11`을 준비합니다. 플랫폼별 requirements 파일과 `scripts/build-stt-sidecar.mjs`가 실제 설정의 기준입니다.

```bash
npm run electron:build      # STT 준비 + 앱 패키징, 게시하지 않음
npm run electron:preview    # STT 준비 + 빌드 후 로컬 실행
```

자동 배포는 `.github/workflows/release-desktop.yml`에서 버전 태그로 수행합니다. `release.yml`은 수동 복구용입니다. `landing/`은 별도의 Pages 워크플로로 배포됩니다. 모델 다운로드와 설치 파일 생성은 시간이 걸리므로 일반 문서 변경 검증과 분리합니다.

## 새 기능을 추가하는 순서

1. 사용자 흐름과 성공·실패·로딩·빈 상태를 정의합니다.
2. 백엔드 담당자와 요청·응답 타입, 오류 코드, WebSocket 이벤트를 합의합니다. 이전 API 계획서를 현재 계약으로 사용하지 않습니다.
3. 기존 `features/<기능>/api`, `hooks`, `components` 경계를 먼저 활용합니다. 단순한 UI에 새 전역 store를 만들 필요는 없습니다.
4. 화면 전용 상태는 컴포넌트에 두고, 공유가 필요한 상태만 store로 올립니다. 저장할 설정과 방송 종료 시 정리할 데이터를 구분합니다.
5. 중요한 동작의 검증을 추가하고 위 빌드·린트 명령을 실행합니다. 아래 수동 통합 시나리오도 별도로 기록합니다.
6. 기능 범위가 바뀌면 README·아키텍처를 갱신하고, PR에 변경 이유·확인 결과·남은 제약을 적습니다.

## 수동 통합 확인

현재 이 시나리오들은 미검증입니다. 실제 실행 후 운영체제·앱 버전·백엔드 버전·결과를 남깁니다.

- 정상·실패 로그인, 동시 401, 갱신 실패 후 로그인 이동
- 캐릭터 CRUD 이후 목록 갱신과 선택 유지
- 방송 중 다른 페이지로 이동한 뒤 음성·연결 유지
- 방송 종료 후 오디오·마이크·타이머·WebSocket 정리
- 캐릭터 변경 시 이전 대화·오버레이 상태 제거
- 연결 단절·재접속·토큰 변경 시 메시지 중복 여부
- 마이크 권한 거부·녹음 취소·STT 시간 초과
- 2D·3D 캐릭터 전환 및 OBS 상태 동기화

## 개선 순서

| 단계 | 변경 | 완료 기준 |
| --- | --- | --- |
| 1 | 문서 통합 및 기준선 기록 | 소개·실행·구조를 찾을 수 있고 검사 결과가 남음 |
| 2 | 검증 기반 | 인증·방송 종료·화면 이동 핵심 테스트와 PR 자동 검사, Node 버전 통일 |
| 3 | 방송 서비스 분리 | 연결·메시지·TTS·립싱크의 책임 분리, 기존 시나리오 유지 |
| 4 | 화면·상태 정리 | 캐릭터 편집과 방송 시작 절차 분리, 전역 초기화의 동기화 역할 축소 |
| 5 | 결과물 공개 | 실제 화면 캡처와 시연, 필요 시 명시적인 샘플 데이터 웹 모드 |
| 6 | 기능 확장 | 한 기능씩 계약·검증·문서까지 완결 |

코드 이동과 기능 변경을 같은 PR에서 크게 섞지 않습니다. 7개 기존 Hook 경고의 실제 의존성을 확인한 뒤 처리하고, 경고를 일괄 비활성화하지 않습니다. 자동 테스트는 `npm test`, 개발 중 반복 실행은 `npm run test:watch`를 사용합니다. 인증 실패와 방송 종료 훅을 격리해 검증하며 실제 서버·오디오·OBS 통합 테스트를 대체하지 않습니다.

## 개발 규칙

- Electron의 `file://` 실행을 고려해 HashRouter와 상대 asset 경로를 유지합니다.
- 운영체제 기능은 contextIsolation과 preload IPC 경계를 통해 사용합니다.
- 일반 API 요청은 공통 apiClient를, 인증 재발급은 bareClient를 사용합니다.
- 공유 상태는 store 액션으로 변경하고 필요한 값만 selector로 구독합니다. 화면 전용 상태는 로컬에 두고, 보관할 설정만 persist합니다.
- 방송·음성 서비스의 수명주기를 페이지 마운트에 종속시키지 않습니다. 구독·타이머·오디오 해제 조건을 확인합니다.
- 폼 스키마는 기능별 schemas에 두고 React Hook Form과 Zod로 검증합니다.
- Vite 환경변수는 `import.meta.env.VITE_*`를 사용합니다. `@/*` 별칭은 `src/*`를 가리킵니다.
- 2칸 들여쓰기와 세미콜론을 사용합니다. 컴포넌트는 PascalCase, 훅·유틸은 camelCase, 상수는 UPPER_SNAKE_CASE를 사용합니다.
- TS/TSX 파일 상단에는 역할과 주요 의존성을 설명하는 주석을 둡니다. 비동기 오류는 unknown 타입을 좁혀 처리하고 사용자 상태 또는 호출자에 전달합니다.

## 개인 개발 도구 설정

개인 도구의 안내 파일은 공개 문서와 별도로 로컬에서 관리합니다. 이 체크아웃에서만 추적을 막으려면 `.git/info/exclude`를 사용합니다. 이미 Git이 추적하는 파일은 제외 규칙만 추가해도 제거되지 않으므로, 먼저 삭제 변경을 커밋해야 합니다.

## PR 자동 검사

`Frontend checks`는 PR과 main push에서 Node 20 환경의 설치·린트·테스트·프론트 빌드·Electron 컴파일을 실행합니다. 기존 린트 경고 7개는 오류로 승격하지 않았습니다. 실제 데스크톱 실행과 STT 모델 패키징은 배포·통합 확인에서 다룹니다.
