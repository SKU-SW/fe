# 실행·검증 기준선

검증일: 2026-10-08 (Asia/Seoul). 기준 코드: `278bd9842fd4cfa9b12e025547b89f5622ec44ba`.

환경: macOS, Node 25.9.0, npm 11.12.1. 배포 CI의 Node 20과 다른 환경이므로 CI·Windows 동작까지 검증한 결과는 아닙니다.

| 검사 | 결과 |
| --- | --- |
| npm ci --no-audit --no-fund | 성공, 682개 패키지 설치; 일부 하위 패키지 deprecation 경고 |
| npm run build | 성공, TypeScript 검사 + Vite production build |
| npm run electron:build-main | 성공, Electron TypeScript 컴파일 |
| npm run lint | 종료 코드 0, 152개 파일 대상 오류 0 / 경고 7 |
| 자동 테스트 | package.json에 테스트 명령 없음 |
| 브라우저·Electron UI 조작 | 미검증 |
| 백엔드·STT·OBS 통합 | 미검증 |
| 설치 파일 생성·실행 | 미검증 |

## Hook 경고

모두 `react-hooks/exhaustive-deps` 경고입니다. 위치는 기준 코드 기준입니다.

| 파일 | 줄 | 확인할 내용 |
| --- | --- | --- |
| src/components/AppInitializer.tsx | 122 | overlayEmotionImageMap이 렌더마다 새 참조가 될 수 있음 |
| src/components/AppInitializer.tsx | 441 | appearance, character, characterInfo 의존성 누락 |
| src/features/broadcast/hooks/useStreamInfo.ts | 138 | broadcastStartedAt 의존성 불필요 경고 |
| src/features/character/hooks/useCharacter.ts | 101 | setCharacterDetail 의존성 누락 |
| src/features/character/hooks/useCharacters.ts | 115 | setCharacterDetail 의존성 누락 |
| src/pages/CharacterPage.tsx | 508, 552 | settings 의존성 불필요 경고 |

## 빌드 경고

- 주 JavaScript 출력: 약 1,561 kB, gzip 약 437 kB. 초기 로딩 시간이나 실행 성능의 측정값은 아닙니다.
- broadcastApi는 정적·동적 import가 함께 있어 해당 동적 import만으로 별도 chunk로 분리되지 않습니다.
- PostCSS 설정의 모듈 형식 경고와 Browserslist 데이터 갱신 안내가 있습니다.

현재 코드가 실행 가능한지에 대한 전체 판정은 아직 하지 않았습니다. 다음 단계는 핵심 통합 시나리오를 실행하고 재현 가능한 테스트를 추가하는 것입니다. 문서 정리 PR에서는 동작 코드·의존성·배포 설정을 변경하지 않습니다.
