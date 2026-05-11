# Safety 페이지 문서

## 대상 라우트

- `/safety`

## 관련 파일

- `swproject/src/pages/SafetyPage.tsx`
- `swproject/src/shared/stores/safetyStore.ts`

## 현재 구현 상태

- 금지어 추가
- 중복 입력 방지
- 개별 삭제
- 전체 삭제 확인 모달

## 데이터 특성

- 현재는 로컬 store 기반 관리입니다.
- 서버 연동형 금지어 관리로 확장될 가능성이 있습니다.

## 화면 구성

- 유해 단어 필터 설명 카드
- 단어 입력 폼
- 등록된 단어 목록
- 전체 삭제 모달

## UX 메모

- 페이지 완성도는 현재 placeholder 페이지들보다 높습니다.
- 실제 운영용으로 가려면 서버 동기화, 필터 타입 구분, 로그 조회가 추가되어야 합니다.
