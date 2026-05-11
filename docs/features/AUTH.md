# Auth 페이지 문서

## 대상 라우트

- `/login`
- `/signup`

## 관련 파일

- `swproject/src/pages/auth/LoginPage.tsx`
- `swproject/src/pages/auth/SignupPage.tsx`
- `swproject/src/features/auth/api/authApi.ts`
- `swproject/src/features/auth/hooks/useLogin.ts`
- `swproject/src/features/auth/hooks/useSignup.ts`
- `swproject/src/features/auth/hooks/useLogout.ts`
- `swproject/src/features/auth/schemas/authSchemas.ts`
- `swproject/src/shared/stores/authStore.ts`

## 현재 구현 상태

- 이메일 로그인/회원가입 UI 구현됨
- `react-hook-form + zod` 검증 적용됨
- access/refresh token 저장 구현됨
- Google 버튼 UI는 존재하지만, 실제 백엔드 OAuth 연결 상태는 별도 확인 필요

## 화면 구성

### LoginPage
- 이메일 입력
- 비밀번호 입력
- 비밀번호 보기 토글
- 로그인 버튼
- Google 로그인 버튼
- 회원가입 이동 링크

### SignupPage
- 이름, 이메일, 비밀번호, 비밀번호 확인
- 비밀번호 보기 토글 2종
- 가입 버튼
- Google 회원가입 버튼
- 로그인 이동 링크

## 데이터 흐름

1. 사용자가 폼 입력
2. Zod 스키마 검증
3. `useLogin` 또는 `useSignup` 실행
4. `authApi.ts` 호출
5. 성공 시 `authStore.setAuth()`
6. 대시보드로 이동

## UX 메모

- 두 페이지 모두 다크 테마 기준으로 일관성 있음
- `setFocus()`로 최초 포커스 처리됨
- API 에러는 상단 alert 박스로 노출됨

## 리팩토링 메모

- 로그인/회원가입 입력 UI 패턴이 유사해 공통 필드 래퍼로 묶을 여지가 있음
- OAuth 상태가 실제로 연결됐는지 문서/코드 기준 재확인 필요
