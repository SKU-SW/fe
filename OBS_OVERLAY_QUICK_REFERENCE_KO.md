# SKU-SW OBS 오버레이 구현 - 빠른 참조 (Quick Reference)

## 🎯 핵심 요약

**상태**: ✅ 구현 준비 완료  
**필수 파일**: 모두 존재 ✅  
**중대 위험**: 4가지 (모두 해결 가능)  
**예상 시간**: 3-6시간

---

## 🔴 즉시 해결 필요 (P0 - 4가지)

### 1️⃣ Transcript 업데이트 (5분)
**파일**: `swproject/src/pages/DashboardPage.tsx:111-131`
```typescript
// 추가할 코드:
const setCurrentTranscript = useAIModeStore((s) => s.setCurrentTranscript);
// handleVoiceResponse 콜백에 추가:
setCurrentTranscript(voiceText);
```

### 2️⃣ Emotion 필드 추가 (1-2시간, 백엔드)
**파일**: 백엔드 `StreamWsVoiceMetadata` DTO
```typescript
// 추가할 필드:
emotion: StreamEmotion;  // "happy"|"sad"|"angry"|"crying"|"default"
```

### 3️⃣ 캐릭터 이미지 렌더링 (15분)
**파일**: `swproject/src/pages/OverlayPage.tsx:46-87`
```typescript
// 추가할 import:
import { useCharacterStore } from '@/shared/stores/characterStore';
import { useCharacter } from '@/features/character/hooks';

// 추가할 코드:
const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
const { character } = useCharacter(selectedCharacterId);
const characterImageUrl = character?.characterImageUrl;

// 렌더링:
{characterImageUrl && <img src={characterImageUrl} alt="Character" className="h-72 w-72 rounded-[28px] object-cover" />}
```

### 4️⃣ Electron 투명 설정 (10분)
**파일**: `swproject/electron/main.ts:262-275`
```typescript
// 추가할 옵션:
transparent: true,
frame: false,
webPreferences: {
  backgroundThrottling: false,
}
```

---

## 🟡 환경 설정 (P1 - 2가지)

### 5️⃣ WebSocket URL 설정
**파일**: `swproject/.env.local`
```env
VITE_WS_URL=ws://localhost:8080
```

### 6️⃣ 이미지 URL 설정
**파일**: `swproject/.env.local`
```env
VITE_IMAGE_BASE_URL=https://dev-img.sku-sw.cloud
```

---

## 📊 필수 파일 체크리스트

### 라우팅 ✅
- [x] `swproject/src/App.tsx` - `/overlay` 라우트 정의
- [x] `swproject/src/main.tsx` - HashRouter 설정

### 상태 관리 ✅
- [x] `swproject/src/shared/stores/aiModeStore.ts` - currentEmotion, currentTranscript, broadcastStreamId
- [x] `swproject/src/shared/stores/characterStore.ts` - selectedCharacterId
- [x] `swproject/src/shared/stores/authStore.ts` - accessToken (WebSocket 연결용)

### API 및 통신 ✅
- [x] `swproject/src/shared/lib/axios.ts` - JWT 자동 주입
- [x] `swproject/src/features/broadcast/api/broadcastApi.ts` - 방송 시작/종료
- [x] `swproject/src/features/broadcast/api/streamApi.ts` - 방송 정보 조회
- [x] `swproject/src/features/broadcast/hooks/useStreamWS.ts` - WebSocket 클라이언트

### 타입 정의 ✅
- [x] `swproject/src/shared/types/stream.ts` - StreamEmotion, StreamDialogue
- [x] `swproject/src/shared/types/broadcast.ts` - 방송 DTO
- [x] `swproject/src/shared/types/broadcastWs.ts` - WebSocket 메시지

### UI 컴포넌트 ✅
- [x] `swproject/src/pages/OverlayPage.tsx` - 오버레이 페이지
- [x] `swproject/src/pages/DashboardPage.tsx` - WebSocket 핸들러

### Electron ✅
- [x] `swproject/electron/main.ts` - BrowserWindow 설정

### 환경 설정 ✅
- [x] `swproject/.env.example` - 템플릿
- [x] `swproject/.env.local` - 개발 설정

---

## 🔗 데이터 흐름

```
Backend WebSocket
    ↓ (Binary audio + Text metadata)
useStreamWS.ts (ws.onmessage)
    ↓ (handleVoiceResponse callback)
DashboardPage.tsx
    ↓ (upsertDialogues + setCurrentTranscript)
aiModeStore
    ↓ (selector subscription)
OverlayPage.tsx
    ↓ (React re-render)
OBS Browser Source
```

---

## 🧪 테스트 순서

1. **로컬 개발 환경**
   ```bash
   npm run dev  # Vite 개발 서버 시작
   ```

2. **방송 시작**
   - 대시보드 → 캐릭터 선택 → 방송 시작

3. **오버레이 확인**
   - 브라우저: `http://localhost:5173/#/overlay`
   - 확인: 감정 박스, 캐릭터 이미지, Transcript 텍스트

4. **OBS 통합**
   - OBS → Browser Source 추가
   - URL: `http://localhost:5173/#/overlay`
   - 확인: 실시간 업데이트

---

## ⚠️ 일반적인 문제 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| OBS에서 오버레이 안 보임 | URL 오류 또는 방송 미시작 | 브라우저에서 직접 접속 확인 |
| Transcript 텍스트 안 보임 | setCurrentTranscript 미호출 | DashboardPage.tsx에 코드 추가 |
| 캐릭터 이미지 안 보임 | VITE_IMAGE_BASE_URL 미설정 | .env.local 확인 |
| WebSocket 연결 실패 | VITE_WS_URL 미설정 | .env.local 확인 |
| 배경 투명 안 됨 | Electron transparent 미설정 | main.ts에 옵션 추가 |

---

## 📁 파일 구조

```
swproject/
├── src/
│   ├── pages/
│   │   ├── OverlayPage.tsx          ← 오버레이 UI
│   │   └── DashboardPage.tsx        ← WebSocket 핸들러
│   ├── features/
│   │   ├── broadcast/
│   │   │   ├── api/
│   │   │   │   ├── broadcastApi.ts
│   │   │   │   └── streamApi.ts
│   │   │   └── hooks/
│   │   │       └── useStreamWS.ts
│   │   └── character/
│   │       ├── api/
│   │       │   └── characterApi.ts
│   │       └── hooks/
│   │           └── useCharacter.ts
│   ├── shared/
│   │   ├── stores/
│   │   │   ├── aiModeStore.ts
│   │   │   ├── characterStore.ts
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   ├── stream.ts
│   │   │   ├── broadcast.ts
│   │   │   └── broadcastWs.ts
│   │   └── lib/
│   │       └── axios.ts
│   ├── App.tsx                      ← 라우트 정의
│   └── main.tsx                     ← HashRouter
├── electron/
│   └── main.ts                      ← Electron 설정
├── .env.example
├── .env.local
└── vite.config.ts
```

---

## 🎯 구현 단계별 시간 추정

| 단계 | 작업 | 시간 | 담당 |
|------|------|------|------|
| 1 | Transcript 업데이트 | 5분 | FE |
| 2 | 캐릭터 이미지 렌더링 | 15분 | FE |
| 3 | Electron 투명 설정 | 10분 | FE |
| 4 | 환경 변수 설정 | 1분 | DevOps |
| 5 | 로컬 테스트 | 30분 | QA |
| 6 | Emotion 필드 추가 (BE) | 1-2h | BE |
| 7 | Emotion 업데이트 로직 | 30분 | FE |
| 8 | OBS 통합 테스트 | 30분 | QA |
| **총합** | | **3-6h** | |

---

## 🚀 배포 체크리스트

- [ ] Phase 1 모든 변경사항 적용 및 테스트
- [ ] Phase 2 Emotion 필드 백엔드 배포
- [ ] 스테이징 환경에서 E2E 테스트
- [ ] 문서 업데이트 (OVERLAY.md)
- [ ] 프로덕션 배포

---

**마지막 업데이트**: 2026년 5월 11일  
**상태**: 검증 완료 ✅
