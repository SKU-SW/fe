# 개발 규칙

## 기준과 명령

- 앱 코드는 `swproject/`에 있습니다. 실행 방법은 [개발 가이드](docs/DEVELOPMENT.md), 구조는 [아키텍처](docs/ARCHITECTURE.md)를 참고합니다.
- 문서와 코드가 다르면 실제 소스 및 package.json·lockfile을 확인하고 문서를 갱신합니다.
- 변경에 맞춰 `npm run build`, `npm run electron:build-main`, `npm run lint`를 실행합니다. 기존 경고는 [기준선](docs/BASELINE.md)에 있습니다.

## 구현 규칙

- HashRouter, Electron 상대 asset 경로, contextIsolation 및 preload IPC 경계를 유지합니다.
- API는 feature의 api 모듈과 공통 apiClient를 사용합니다. 토큰 재발급은 bareClient로 분리합니다.
- 상태는 store 액션으로 수정하고 selector로 구독합니다. 화면 전용 상태는 로컬에 두고, 영구 보관이 필요한 설정만 persist합니다.
- 방송·STT의 전역 수명주기를 페이지 마운트에 종속시키지 않습니다. 구독·타이머·오디오 정리를 확인합니다.
- 2칸 들여쓰기, 세미콜론, 컴포넌트 PascalCase, 훅·유틸 camelCase, 상수 UPPER_SNAKE_CASE를 사용합니다.
- TS/TSX 파일 상단에 역할과 주요 의존성을 설명하는 JSDoc을 둡니다.
- 비동기 오류를 사용자 상태 또는 호출자로 전달하고, unknown 오류를 좁혀 처리합니다.

## 문서와 변경 범위

- 문서는 docs/의 현재 문서에 갱신합니다. 작업마다 중복 계획서·완료 보고서를 추가하지 않습니다.
- 계획과 구현 완료, 빌드 성공과 통합 실행 성공을 구분합니다.
- 리팩터링·기능 변경·의존성 업그레이드를 작은 변경으로 나누고 검증 결과를 기록합니다.
