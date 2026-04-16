# Auth Pages Design — Login & Signup

**Date:** 2026-04-14  
**Scope:** `/login` 및 `/signup` 페이지 구현

---

## 1. 목표

이메일 로그인/회원가입과 Google OAuth를 지원하는 인증 페이지 구현.  
백엔드(localhost:8080) REST API와 연동하며, 기존 `useAuthStore`(Zustand) 및 `axios.ts` 인프라를 활용한다.

---

## 2. 파일 구조

```
src/
├── auth.ts                                  # next-auth v5 config
├── features/
│   └── auth/
│       ├── components/
│       │   ├── AuthCard.tsx                 # 공통 카드 래퍼 (다크 테마)
│       │   └── GoogleButton.tsx             # Google OAuth 버튼
│       └── schemas/
│           └── authSchemas.ts               # zod 스키마
└── app/
    ├── (auth)/
    │   ├── login/page.tsx
    │   └── signup/page.tsx
    └── api/auth/[...nextauth]/
        └── route.ts                         # handlers re-export
```

---

## 3. 데이터 흐름

### 이메일 로그인
1. react-hook-form + zod 검증
2. `POST /auth/login` (axios) → `{ accessToken, user }`
3. `useAuthStore.setAuth(user, accessToken)`
4. `/dashboard` 리다이렉트

### 이메일 회원가입
1. react-hook-form + zod 검증
2. `POST /auth/signup` (axios)
3. 성공 → `/login` 이동

### Google 로그인/회원가입
1. `signIn('google')` 호출
2. next-auth OAuth 처리
3. `jwt` 콜백: Google `access_token`을 백엔드에 전달 → 백엔드 `accessToken` + `user` 수신
4. `app/(auth)/layout.tsx`의 `useEffect`: next-auth `useSession()` 세션 변화 감지 → Zustand `setAuth()` 동기화
5. `/dashboard` 리다이렉트

---

## 4. next-auth v5 설정 (`auth.ts`)

- `GoogleProvider` 등록
- `jwt` 콜백에서 Google 토큰을 백엔드로 전달하고 백엔드 JWT 수신
- `session` 콜백에서 백엔드 토큰을 세션에 포함
- 환경변수: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`

---

## 5. UI 스펙

### 테마 (드래프트 기준)
| 요소 | 클래스 |
|---|---|
| 페이지 배경 | `bg-slate-950` |
| 카드 | `bg-slate-900 border border-slate-800 rounded-2xl` |
| 인풋 | `bg-slate-950 border-slate-700 rounded-xl` focus `ring-blue-500` |
| 주 버튼 | `bg-blue-600 hover:bg-blue-700 text-white rounded-xl` |
| Google 버튼 | `bg-white text-black border border-slate-200 rounded-xl` |
| 라벨 | `text-slate-300 text-sm font-medium` |
| 에러 텍스트 | `text-red-400 text-sm` |

### 로그인 페이지 (`/login`)
- 이메일 인풋 (Mail 아이콘)
- 비밀번호 인풋 (Lock 아이콘) + 우측 상단 "비밀번호 찾기" 링크
- "로그인" 제출 버튼
- 구분선 "또는"
- Google 로그인 버튼
- 하단: "계정이 없으신가요? → /signup 링크"

### 회원가입 페이지 (`/signup`)
- 이름 인풋 (User 아이콘)
- 이메일 인풋 (Mail 아이콘)
- 비밀번호 인풋 (Lock 아이콘)
- 비밀번호 확인 인풋 (Lock 아이콘)
- "가입하기" 제출 버튼
- 구분선 "또는 소셜 계정으로 간편 가입"
- Google 회원가입 버튼
- 하단: "이미 계정이 있으신가요? → /login 링크"

---

## 6. 폼 검증 (zod)

| 필드 | 규칙 |
|---|---|
| 이름 | 최소 2자 |
| 이메일 | 유효한 이메일 형식 |
| 비밀번호 | 최소 8자 |
| 비밀번호 확인 | 비밀번호 필드와 일치 |

---

## 7. 에러 처리

- **필드 에러**: react-hook-form `errors` 객체 → 각 인풋 하단 인라인 표시
- **API 에러**: 폼 상단 빨간 메시지 박스
- **로딩 상태**: 제출 중 버튼 비활성화 + 텍스트 변경 ("로그인 중...", "가입 중...")

---

## 8. Access Token 재발급

기존 `axios.ts` 응답 인터셉터 확장:
1. 401 응답 수신
2. 백엔드 Access Token 재발급 엔드포인트 1회 호출 (Notion API 문서의 정확한 경로 확인 필요)
3. 성공 → 새 토큰 Zustand 저장 → 원래 요청 재시도
4. 실패 → `clearAuth()` + `/login` 리다이렉트

---

## 9. 라우트 보호

- 로그인 상태에서 `/login`, `/signup` 접근 → `/dashboard` 리다이렉트
- 미로그인 상태에서 보호 라우트 접근 → `/login` 리다이렉트
- Next.js middleware(`middleware.ts`)로 처리

---

## 10. 소셜 로그인 범위

Google OAuth만 구현. 카카오/네이버는 이번 범위 외.