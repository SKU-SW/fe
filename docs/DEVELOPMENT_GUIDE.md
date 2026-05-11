# SKU-SW 개발 플랜 및 에이전트 코딩 가이드

> 최신 문서 진입점: [`README.md`](./README.md)
> 이 문서는 워크플로우/계획 중심의 기존 가이드입니다. 현재 페이지별 상태는 `docs/features/*.md`를 먼저 보세요.

## 📚 문서 구조

프로젝트의 효율적인 에이전트 코딩을 위해 3개의 MD 문서가 생성되었습니다:

### 1. **SPECIFICATIONS.md** (28KB, 722줄)
**용도**: 기능 명세 및 개발 계획 수립

**포함 내용**:
- 🎯 11개 카테고리별 51개 기능 정의
- 📊 각 기능의 스토리포인트 (총 84 SP)
- 🚀 3단계 개발 우선순위
- 📋 기능별 상세 명세 (입력값, 출력값, 의존성)
- 🔗 기능 간 의존성 맵

**활용 시점**: 
- 개발 스프린트 계획 수립
- 기능 상세 요구사항 확인
- 에이전트에게 특정 기능 구현 요청

### 2. **PROJECT_GUIDE.md** (20KB, 680줄)
**용도**: 프로젝트 아키텍처 및 코딩 컨벤션

**포함 내용**:
- 📁 전체 디렉토리 구조 (상세 설명)
- 🛠️ 기술 스택 및 환경 설정
- ✨ 코딩 컨벤션 (명명, 스타일, 패턴)
- 🏗️ 주요 기능별 아키텍처
- 📝 타입 정의 및 API 패턴

**활용 시점**:
- 신규 개발자 온보딩
- 코드 작성 시 규칙 확인
- 새 파일/모듈 추가 시 구조 이해

### 3. **AGENTS.md** (12KB, 344줄)
**용도**: AI 에이전트 최적화 (OpenCode 자동 참고)

**포함 내용**:
- 🤖 프로젝트 핵심 정보 요약
- 💻 코드 패턴 예시
- 📋 새 기능 추가 체크리스트
- ⚠️ 주의사항

**활용 시점**:
- OpenCode 실행 시 자동 참고
- 에이전트와 대화할 때 문맥 제공

---

## 🚀 에이전트 코딩 워크플로우

### Step 1: 기능 이해하기

```bash
# 1. SPECIFICATIONS.md에서 구현할 기능 찾기
예) "3.1.5 캐릭터 말투 설정" 검색

# 2. 기능의 스토리포인트, 상태, 설명 확인
- 스토리포인트: 1 (작은 작업)
- 상태: 시작 전
- 설명: AI 캐릭터의 말투 스타일 선택
- 선택지: 친근한 반말, 깍듯한 존댓말, 장난기 섞인 반말, 방송용 과장체
```

### Step 2: 에이전트에게 요청하기

```markdown
"SPECIFICATIONS.md의 3.1.5 캐릭터 말투 설정 기능을 구현해줄 수 있어?

스토리포인트: 1
선택지: 친근한 반말, 깍듯한 존댓말, 장난기 섞인 반말, 방송용 과장체

참고:
- PROJECT_GUIDE.md의 코딩 컨벤션을 따라줘
- 3.1 캐릭터 정보 설정의 다른 기능들(3.1.1~3.1.4)을 먼저 구현했어
- 캐릭터 정보는 src/shared/types/character.ts에 정의돼있어"
```

### Step 3: 플랜 검토하기

에이전트가 제시한 플랜을 확인:

```
에이전트 플랜:
1. src/shared/types/character.ts에 SpeechTone enum 추가
2. src/features/character/components/ToneSelector.tsx 생성
3. src/pages/CharacterPage.tsx에 ToneSelector 통합
4. src/shared/stores/characterStore.ts에 tone 필드 추가
5. 테스트 및 검증
```

**검토 포인트**:
- ✅ PROJECT_GUIDE.md의 디렉토리 구조 준수?
- ✅ AGENTS.md의 패턴 예시 따름?
- ✅ 의존성 올바름? (3.1.1~3.1.4 완료 상태 확인)

### Step 4: 코드 작성 및 적용

```markdown
"플랜 좋아. 코드를 작성해줄 수 있어?

주의:
- 파일 상단에 JSDoc 주석 추가해줘
- Tailwind CSS 사용해서 UI 만들어줘
- 에러는 try-catch로 처리해줘
- 타입은 명시적으로 작성해줘"
```

### Step 5: 테스트 및 최적화

```markdown
"코드를 먼저 작성하고 테스트해줄 수 있어?

체크리스트:
1. 타입 에러 없음?
2. UI가 반응형인가?
3. 상태 관리가 올바른가?
4. 에러 처리가 있는가?"
```

---

## 📖 문서별 참고 방법

### SPECIFICATIONS.md 사용법

#### 기능 찾기
```
1. 카테고리별 목차 이용 (## 1-11)
2. 원하는 기능 찾기
3. 스토리포인트, 설명, 요구사항 확인
```

#### 스토리포인트 계획
```
Phase 1 (MVP): 16 SP
Phase 2 (확장): 30 SP
Phase 3 (고도화): 38 SP

예) "이번 스프린트에서 3.1과 3.2를 다 하려면?"
→ 3.1: 2+1+3+3+1+1+1 = 12 SP
→ 3.2: 3+3+3+3 = 12 SP
→ 총 24 SP (1.5주 정도)
```

#### 의존성 확인
```
예) 7.1 "방송 흐름상 중요한 채팅 선제 반응" 구현 전에:
- 3.2.1 "채팅 선제 반응 민감도" 완료?
- 5.1.1 "채팅 여론 분석" 완료?
- 확인 후 진행
```

### PROJECT_GUIDE.md 사용법

#### 새 페이지 추가
```
1. "7.1 새 페이지 추가" 섹션 참고
2. 디렉토리 구조 확인 (섹션 2)
3. 라우팅 추가 (섹션 4 라우팅)
4. 페이지 컴포넌트 생성
```

#### API 연동
```
1. "5. 코딩 컨벤션 및 패턴" - API 호출 패턴 참고
2. src/features/{name}/api/{name}Api.ts 생성
3. src/features/{name}/hooks/useXxx.ts 생성
4. 컴포넌트에서 훅 사용
```

#### 상태 관리 추가
```
1. "4.5 상태 관리 패턴 (Zustand)" 예시 참고
2. src/shared/stores/xxxStore.ts 생성
3. persist 미들웨어 추가
4. 타입 정의
```

### AGENTS.md 사용법

#### 에이전트와 대화할 때
```
"PROJECT_GUIDE.md의 코딩 컨벤션을 따라줘"

에이전트가 자동으로 확인하는 항목:
- 명명 규칙 (camelCase, PascalCase)
- 파일 상단 JSDoc
- Zustand Store 패턴
- API 레이어 분리
- 에러 처리
```

#### 새 기능 체크리스트
```
AGENTS.md의 "새로운 기능 추가 체크리스트" 참고:

1. 타입 정의 ✓
2. API 함수 ✓
3. 커스텀 훅 ✓
4. 컴포넌트 ✓
5. 라우트 ✓
6. 상태 관리 ✓
7. JSDoc 주석 ✓
```

---

## 💡 효율적인 개발 팁

### Tip 1: 한 번에 한 기능씩

```markdown
❌ 나쁜 예: "3.1과 3.2를 다 구현해줄 수 있어?"
✅ 좋은 예: "SPECIFICATIONS.md의 3.1.1 캐릭터 성별 설정만 구현해줄 수 있어?"
```

### Tip 2: 의존성 명시

```markdown
"3.1.2 캐릭터 이름 설정을 구현해주는데,
3.1.1이 이미 완료되었다고 가정해줄 수 있어?
그리고 authorStore의 패턴처럼 characterStore를 만들어줄래?"
```

### Tip 3: 참고 파일 명시

```markdown
"src/features/auth/hooks/useLogin.ts를 참고해서
useCharacter.ts를 만들어줄 수 있어?

같은 패턴으로:
- 로딩 상태 (isPending)
- 에러 상태 (error)
- 성공 콜백 (navigate)
- try-catch 에러 처리"
```

### Tip 4: UI 디자인 명시

```markdown
"TailwindCSS를 사용해서 셀렉트 UI를 만들어줄 수 있어?
참고:
- DashboardLayout.tsx의 스타일 방식 따라줘
- 반응형 디자인 적용
- dark mode 고려"
```

### Tip 5: 테스트 포함

```markdown
"기능을 구현한 후에 테스트도 해줄 수 있어?

체크 항목:
1. 타입 에러 없음?
2. 런타임 에러 없음?
3. UI가 제대로 보임?
4. 상태 저장되나? (localStorage)"
```

---

## 🎯 개발 플랜 예시

### 주차별 계획 (Phase 1: MVP)

```
Week 1 (SP 16):
- Monday: 1.1, 2.1 (인증 기본)
  에이전트: "SPECIFICATIONS.md 1.1, 2.1을 구현해줄 수 있어?"

- Tuesday: 3.1.1 ~ 3.1.2 (캐릭터 기본)
  에이전트: "3.1 캐릭터 정보 설정의 성별, 이름 기능을 구현해줄 수 있어?"

- Wednesday: 4.1 ~ 4.2 (대화 기능)
  에이전트: "4.1, 4.2 대화 기능을 구현해줄 수 있어?"

- Thursday: 5.1.1 (채팅 여론 분석)
  에이전트: "SPECIFICATIONS.md의 5.1.1을 구현해줄 수 있어?"

- Friday: 6.1 ~ 6.2.2 (AI 반응 전략)
  에이전트: "6.1, 6.2를 구현해줄 수 있어?"
```

### 기능별 에이전트 요청 템플릿

```markdown
## 요청 제목: [기능명] 구현

### 기능 명세
- SPECIFICATIONS.md의 [섹션] 참고
- 스토리포인트: [숫자]
- 선택지/설명: [내용]

### 구현 범위
1. 타입 정의
2. API 함수
3. 커스텀 훅
4. UI 컴포넌트
5. 상태 관리

### 참고 사항
- PROJECT_GUIDE.md의 [섹션] 코드 스타일 따라줘
- [기능명]이 선행되어야 함
- Tailwind CSS 사용
- 에러 처리 포함

### 완료 조건
- [ ] 타입 에러 없음
- [ ] 런타임 에러 없음
- [ ] UI 렌더링 정상
- [ ] 상태 저장/복원 정상
- [ ] 파일 상단 JSDoc 주석 포함
```

---

## 🔄 반복 루프 (Iteration Loop)

### 1차 반복: 요구사항 이해

```
User: "SPECIFICATIONS.md의 3.1.5를 구현해줄 수 있어?"
Agent: "3.1.5 캐릭터 말투 설정이 맞죠? 
        선택지는 친근한 반말, 깍듯한 존댓말, 장난기 섞인 반말, 방송용 과장체네요.
        구현 플랜을 먼저 제시할까요?"
```

### 2차 반복: 플랜 검증

```
User: "네, 플랜을 제시해줄 수 있어?"
Agent: "
1. src/shared/types/character.ts에 SpeechTone enum 추가
2. src/features/character/components/ToneSelector.tsx 생성
3. src/shared/stores/characterStore.ts에 tone 필드 추가
4. CharacterPage.tsx에 ToneSelector 통합
"
User: "좋아, 코드를 작성해줄 수 있어?"
```

### 3차 반복: 코드 작성

```
User: "PROJECT_GUIDE.md의 상태 관리 패턴을 따라줄 수 있어?"
Agent: "[코드 작성]"
```

### 4차 반복: 검증 & 최적화

```
User: "테스트를 해줄 수 있어? 타입 에러, 런타임 에러, UI 렌더링 확인"
Agent: "[테스트 결과 보고]"
User: "완벽해! 다음 기능으로 넘어갈까?"
```

---

## 📚 추가 자료

### 문서 파일 위치

```
/Users/lee/sku-sw/
├── PROJECT_GUIDE.md          # 아키텍처 & 컨벤션 (20KB)
├── SPECIFICATIONS.md         # 기능 명세서 (28KB)
├── AGENTS.md                 # 기본 가이드 (구식)
└── swproject/
    ├── AGENTS.md             # 에이전트 최적화 (12KB) ⭐
    ├── package.json          # 기술 스택
    ├── tsconfig.json         # TS 설정
    └── src/
        ├── features/         # Feature-based modules
        ├── shared/           # Types, Stores, Hooks
        └── pages/            # 페이지 컴포넌트
```

### 빠른 링크

- 🎯 기능 명세: `/Users/lee/sku-sw/SPECIFICATIONS.md`
- 🏗️ 아키텍처: `/Users/lee/sku-sw/PROJECT_GUIDE.md`
- 🤖 에이전트 최적화: `/Users/lee/sku-sw/swproject/AGENTS.md`

---

## ✅ 체크리스트

개발을 시작하기 전에 확인하세요:

```
[ ] SPECIFICATIONS.md를 읽었나? (기능 전체 이해)
[ ] PROJECT_GUIDE.md의 코딩 컨벤션을 이해했나?
[ ] AGENTS.md의 패턴을 숙지했나?
[ ] 개발 환경 설정이 완료되었나? (npm install, .env.local 등)
[ ] 첫 번째 기능 (1.1, 2.1)을 선택했나?
[ ] 에이전트와 첫 대화를 준비했나?
```

---

이제 **효율적인 에이전트 코딩**을 시작할 준비가 되었습니다! 🚀
