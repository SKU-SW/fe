# SKU-SW 레거시 문서 가이드

> 이 문서는 **보관용/과거 안내 문서**입니다.
> 현재 문서 시작점은 [`../README.md`](../README.md) 입니다.

과거에 작성된 문서 묶음과 워크플로우를 설명하는 자료이며, 실제 최신 구조는 `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/features/*.md`를 우선 참고하세요.

## 📚 문서 구성

4개의 MD 문서로 프로젝트 전체를 체계적으로 이해하고 개발할 수 있습니다.

### 1️⃣ **DEVELOPMENT_GUIDE.md** ⭐ 여기서 시작!
**목적**: 에이전트 코딩 워크플로우 이해

**내용**:
- 📖 3개 문서의 역할과 사용법
- 🚀 Step-by-Step 워크플로우
- 💡 효율적인 개발 팁
- 📋 주차별 계획 예시
- 🔄 반복 루프 (Iteration Loop)

**언제 읽을까?**
- ✅ 프로젝트 시작 시 (필독!)
- ✅ 에이전트와 처음 대화할 때
- ✅ 개발 진행 방식을 모를 때

---

### 2️⃣ **SPECIFICATIONS.md** 기능 명세서
**목적**: 모든 기능의 상세 정의 및 개발 계획

**내용**:
- 📋 51개 기능의 상세 명세
- 🎯 각 기능의 스토리포인트
- 🚀 3단계 우선순위 (Phase 1-3)
- 🔗 기능 간 의존성
- 📊 총 84 SP 분석

**언제 참고할까?**
- ✅ 구현할 기능의 상세 요구사항 확인
- ✅ 스프린트 계획 수립
- ✅ 기능 간 의존성 확인
- ✅ 에이전트에게 상세 명세 제공

**주요 섹션**:
```
1. 인증 (Authentication) - 이메일, 소셜 로그인
2. AI 캐릭터 설정 - 7개 세부 설정
3. 캐릭터 방송 설정 - 4개 설정
4. 대화 기능 - 음성 입력/출력
5. 채팅 분석 - 여론 분석, 통계
6. AI 반응 전략 - 자동/수동 설정
7. AI 선제 반응 시스템 - 4개 기능
8. 게임 연동 - LoL 이벤트
9. 안전 관리 - 금지어, 필터링
10. 방송 통계 - 데이터 조회
11. 특수 도네이션 - 상호작용
```

---

### 3️⃣ **PROJECT_GUIDE.md** 아키텍처 & 컨벤션
**목적**: 코드 작성 시 따를 규칙과 아키텍처 이해

**내용**:
- 📁 전체 디렉토리 구조 (상세 설명)
- 🛠️ 기술 스택 (React, Zustand, Electron 등)
- ✨ 코딩 컨벤션
  - 명명 규칙 (camelCase, PascalCase)
  - 파일 구조
  - JSDoc 주석 규칙
  - 코드 스타일
- 🏗️ 디자인 패턴
  - Zustand Store 패턴
  - API 호출 패턴
  - 폼 처리 패턴
  - 에러 처리 패턴
- 🚀 기능별 아키텍처 (인증, 캐릭터, 채팅)
- 📖 라우팅 구조 (React Router v7)

**언제 참고할까?**
- ✅ 새로운 파일/컴포넌트 작성 시
- ✅ API 호출 패턴 확인
- ✅ 상태 관리 구현
- ✅ 에러 처리 방법

**주요 패턴**:
```typescript
// API 함수 패턴
src/features/{name}/api/{name}Api.ts

// 커스텀 훅 패턴
src/features/{name}/hooks/useXxx.ts

// 상태 관리 패턴
src/shared/stores/xxxStore.ts (Zustand + persist)

// 타입 정의
src/shared/types/xxx.ts
```

---

### 4️⃣ **AGENTS.md** AI 에이전트 최적화
**목적**: OpenCode 등 AI 에이전트가 자동으로 참고

**내용**:
- 🤖 프로젝트 핵심 정보 요약
- 💻 코드 패턴 예시
- 📋 새 기능 추가 체크리스트
- ⚠️ 주의사항

**특징**:
- OpenCode 자동으로 참고
- 에이전트가 이해하기 쉬운 형식
- 핵심만 간결하게 정리

---

### 5️⃣ **API_SPECIFICATIONS.md** ⭐ 백엔드 API 명세
**목적**: Spring Boot 백엔드 REST API 및 WebSocket 스펙 정의

**내용**:
- 📡 9개 섹션의 완전한 API 명세
  - 인증 (회원가입, 로그인, OAuth2, 토큰 갱신)
  - 캐릭터 (CRUD, 설정 옵션)
  - 채팅 분석 (여론, 속도, 키워드, 통계)
  - 게임 연동 (Riot API 래핑)
  - 안전 관리 (금지어, 필터링)
  - 방송 통계 (데이터 조회)
- 🔌 WebSocket 프로토콜
- ⚠️ 에러 처리 및 에러 코드
- 🔒 보안 (레이트 리미팅, CORS, 데이터 검증)

**언제 참고할까?**
- ✅ 백엔드 개발자가 API 구현할 때
- ✅ 프런트엔드 개발자가 API 호출 방식 확인할 때
- ✅ API 통합 테스트할 때
- ✅ WebSocket 연결 설정할 때

**주요 내용**:
```
1. 인증 (Authentication) - 5개 엔드포인트
   - POST /api/v1/auth/register/email
   - POST /api/v1/auth/login/email
   - POST /api/v1/auth/oauth/google/callback
   - POST /api/v1/auth/refresh
   - POST /api/v1/auth/logout

2. 캐릭터 (Character) - 7개 엔드포인트
   - GET /api/v1/characters/settings
   - POST /api/v1/characters
   - GET /api/v1/characters
   - GET /api/v1/characters/{id}
   - PUT /api/v1/characters/{id}
   - DELETE /api/v1/characters/{id}
   - PATCH /api/v1/characters/{id}/select

3. 채팅 분석, 게임, 안전, 통계
   - 총 20+ 엔드포인트

4. WebSocket 프로토콜
   - 실시간 채팅, 게임 이벤트, 여론 업데이트
```

---

## 🎯 읽는 순서

### 첫 번째 개발 (프런트엔드)
```
1. 이 README_DOCUMENTS.md 읽기 (5분)
2. DEVELOPMENT_GUIDE.md 읽기 (15분) ⭐ 필독
3. PROJECT_GUIDE.md의 아키텍처 섹션 읽기 (10분)
4. API_SPECIFICATIONS.md에서 필요한 API 확인 (5분)
5. SPECIFICATIONS.md에서 첫 기능(1.1, 2.1) 찾기
6. 에이전트와 첫 대화!
```

### 첫 번째 개발 (백엔드)
```
1. 이 README_DOCUMENTS.md 읽기 (5분)
2. API_SPECIFICATIONS.md 정독 (30분) ⭐ 필독
3. SPECIFICATIONS.md에서 기능 명세 확인
4. 각 기능의 API 엔드포인트 구현
```

### 매번 기능 개발할 때
```
1. SPECIFICATIONS.md에서 기능 찾기
2. API_SPECIFICATIONS.md에서 관련 API 확인
3. PROJECT_GUIDE.md에서 관련 패턴 확인 (FE 개발 시)
4. 에이전트에게 명세 + 패턴 + 요구사항 전달
5. 코드 작성 & 테스트
```

---

## 📝 에이전트와 대화하는 법

### Good ✅
```markdown
"SPECIFICATIONS.md의 3.1.5 캐릭터 말투 설정을 구현해줄 수 있어?

명세:
- 선택지: 친근한 반말, 깍듯한 존댓말, 장난기 섞인 반말, 방송용 과장체
- 스토리포인트: 1

API (API_SPECIFICATIONS.md 참고):
- PUT /api/v1/characters/{characterId}
- speechTone 필드 업데이트

참고:
- PROJECT_GUIDE.md의 상태 관리 패턴을 따라줘
- characterStore 패턴을 authStore처럼 만들어줄래?
- Tailwind CSS 사용"
```

### Bad ❌
```markdown
"캐릭터 말투 설정 기능을 추가해줄 수 있어?"
```

---

## 📊 문서별 통계

| 문서 | 크기 | 줄 수 | 목적 |
|------|------|-------|------|
| README_DOCUMENTS.md | 6.6KB | 이 파일 (네비게이션) |
| DEVELOPMENT_GUIDE.md | 12KB | 워크플로우 가이드 |
| SPECIFICATIONS.md | 28KB | 기능 명세 (51개 기능, 84 SP) |
| PROJECT_GUIDE.md | 20KB | 아키텍처 & 코딩 컨벤션 |
| API_SPECIFICATIONS.md | 40KB | ⭐ 백엔드 API 명세 |
| AGENTS.md | 12KB | AI 에이전트 최적화 |
| **합계** | **119KB** | **종합 개발 자료** |

---

## 🚀 빠른 시작

### 1단계: 환경 설정
```bash
cd /Users/lee/sku-sw/swproject
npm install
cp .env.example .env.local
npm run dev
```

### 2단계: 문서 읽기
```bash
# 필독
1. DEVELOPMENT_GUIDE.md (15분)
2. PROJECT_GUIDE.md 첫 3섹션 (10분)
```

### 3단계: 첫 기능 선택
```bash
# SPECIFICATIONS.md에서 찾기
Phase 1 기능:
- 1.1 이메일 회원가입
- 2.1 이메일 로그인
```

### 4단계: 에이전트와 대화
```markdown
"SPECIFICATIONS.md 1.1과 2.1을 구현해줄 수 있어?
PROJECT_GUIDE.md의 코딩 컨벤션을 따라줘."
```

---

## 💡 팁

### 문서 검색하기
```bash
# Mac/Linux
grep -n "3.1.5" SPECIFICATIONS.md

# VS Code에서 Ctrl+F 또는 Cmd+F
```

### 파일 위치
```
/Users/lee/sku-sw/
├── README_DOCUMENTS.md ← 지금 읽는 파일
├── DEVELOPMENT_GUIDE.md ⭐ (워크플로우)
├── SPECIFICATIONS.md (기능 명세)
├── PROJECT_GUIDE.md (FE 아키텍처)
├── API_SPECIFICATIONS.md ⭐ (백엔드 API) ← 새로 추가!
└── swproject/
    ├── AGENTS.md
    ├── src/
    │   ├── features/
    │   ├── shared/
    │   └── pages/
    └── package.json
```

---

## ✅ 체크리스트

개발 시작 전 확인사항:

- [ ] 이 README_DOCUMENTS.md를 읽었나?
- [ ] DEVELOPMENT_GUIDE.md를 읽었나?
- [ ] PROJECT_GUIDE.md의 기본 패턴을 이해했나?
- [ ] API_SPECIFICATIONS.md에서 필요한 API를 확인했나?
- [ ] 첫 구현할 기능(1.1, 2.1)을 정했나?
- [ ] 환경 설정이 완료되었나? (npm install 등)
- [ ] SPECIFICATIONS.md에서 기능을 찾아봤나?

---

## 🤔 자주 묻는 질문

**Q: 어디서부터 시작해야 해?**
A: DEVELOPMENT_GUIDE.md를 읽으세요. (15분 소요)

**Q: 기능 명세가 어디 있어?**
A: SPECIFICATIONS.md에 모든 기능이 정의되어 있습니다.

**Q: 코드는 어떻게 작성해야 해?**
A: PROJECT_GUIDE.md의 코딩 컨벤션 섹션을 참고하세요.

**Q: 에이전트와 어떻게 대화해?**
A: DEVELOPMENT_GUIDE.md의 "에이전트 코딩 워크플로우"를 참고하세요.

**Q: 스토리포인트는 뭔가?**
A: 기능의 복잡도/작업량을 나타냅니다. SPECIFICATIONS.md에서 확인하세요.

---

**이제 준비가 되었습니다! 🚀 DEVELOPMENT_GUIDE.md를 읽고 시작하세요!**
