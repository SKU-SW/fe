# Dashboard 페이지 문서

## 대상 라우트

- `/dashboard`

## 관련 파일

- `swproject/src/pages/DashboardPage.tsx`
- `swproject/src/features/dashboard/components/*`
- `swproject/src/features/broadcast/hooks/useStreamInfo.ts`
- `swproject/src/features/broadcast/hooks/useStreamWS.ts`
- `swproject/src/features/broadcast/hooks/useTTSPlayer.ts`
- `swproject/src/features/stt/hooks/useSTT.ts`
- `swproject/src/shared/stores/aiModeStore.ts`

## 역할

방송 중 AI 캐릭터와 스트리머의 실시간 상호작용을 보여주는 핵심 페이지입니다.

## 현재 UI 상태

- 방송 중이 아니면 빈 상태 CTA 표시
- 방송 중이면
  - 방송 헤더
  - 마이크 경고 배너
  - STT / WS 상태 메시지
  - 캐릭터 초상
  - 대화 스트림
  - 방송 토글 컨트롤
  - KPI 카드
  - 활동 로그 패널

## 핵심 흐름

1. 방송 시작 후 `aiModeStore.mode === "broadcasting"`
2. `useStreamInfo()`가 초기 대화 이력 조회
3. `useStreamWS()`가 WebSocket 연결
4. `useSTT()`가 마이크 음성을 텍스트로 변환
5. 텍스트를 WS로 전송
6. 서버가 TTS 바이너리 + 메타데이터 반환
7. 대화 스트림과 오디오 재생에 반영

## 입력 방식

- Push-to-Talk: `Ctrl + M`
- 키를 누르고 있는 동안 녹음
- 키를 떼면 STT 변환 후 전송

## 상태 의존성

- `aiModeStore`: 방송 모드, 토글, 대화, 로그, 현재 감정
- `characterStore`: 선택 캐릭터 ID
- `authStore`: WebSocket access token

## 현재 품질 메모

- 실시간 처리 로직은 비교적 견고함
- 다만 `aiModeStore`에 현재 페이지에서 실제 쓰지 않는 필드가 일부 남아 있음
- `BroadcastControls`에는 선언만 있고 실제 쓰지 않는 prop이 존재함

## 참고

과거 대시보드 리디자인 상세 회고 문서는 `swproject/DASHBOARD_*.md` 계열에 남아 있지만, 현재 작업은 이 문서와 실제 코드 기준으로 진행하는 것이 좋습니다.
