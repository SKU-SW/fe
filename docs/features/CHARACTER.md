# Character 페이지 문서

## 대상 라우트

- `/character`

## 관련 파일

- `swproject/src/pages/CharacterPage.tsx`
- `swproject/src/features/character/components/*`
- `swproject/src/features/character/hooks/*`
- `swproject/src/features/character/api/characterApi.ts`
- `swproject/src/features/broadcast/hooks/useStartBroadcast.ts`
- `swproject/src/features/broadcast/hooks/useTerminateBroadcast.ts`
- `swproject/src/shared/stores/characterStore.ts`
- `swproject/src/shared/stores/aiModeStore.ts`

## 역할

AI 캐릭터 목록 관리, 생성/수정/삭제, 선택, 방송 시작/종료를 담당합니다.

## 화면 모드

- `dashboard`: 캐릭터 목록 대시보드
- `create`: 캐릭터 생성 폼
- `edit`: 캐릭터 수정 폼

## 현재 동작

- 캐릭터 목록 조회
- 첫 캐릭터 자동 선택
- 캐릭터 생성/수정/삭제
- 방송 시작 전 확인 모달
- 방송 시작 시 선택 캐릭터를 백엔드와 다시 동기화한 뒤 `/stream/start` 호출
- 방송 종료 시 `/stream/terminate` 호출

## 데이터 변환 포인트

이 페이지는 UI 모델과 백엔드 DTO 사이의 매핑 로직을 직접 많이 가지고 있습니다.

예:
- speechStyle 매핑
- personality 매핑
- presetType 매핑
- create/update payload 생성
- 백엔드 상세 DTO → UI preset 변환

현재 이 매핑 코드가 페이지 파일 상단에 많이 몰려 있어, 향후 `features/character/mappers.ts` 같은 별도 파일로 분리하는 것이 좋습니다.

## 현재 제약

- 최대 캐릭터 수 제한: `MAX_CHARACTERS_PER_USER`
- 방송 중 캐릭터와 선택 캐릭터를 동일 진실 원천으로 다룸

## 관련 레거시 문서

캐릭터 대시보드 관련 과거 상세 문서는 아래에 분산되어 있습니다.

- `swproject/docs/README_CharacterDashboard.md`
- `swproject/docs/*CharacterDashboard*.md`

신규 작업은 이 문서와 실제 코드 기준으로 보는 것을 권장합니다.
