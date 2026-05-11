# Overlay 페이지 문서

## 대상 라우트

- `/overlay`

## 관련 파일

- `swproject/src/pages/OverlayPage.tsx`
- `swproject/src/shared/stores/aiModeStore.ts`
- `swproject/src/shared/stores/overlayStore.ts`
- `swproject/src/shared/lib/overlayBridge.ts`
- `swproject/src/pages/DashboardPage.tsx`

## 역할

OBS Browser Source에 연결할 수 있는 AI 캐릭터 투명 오버레이 페이지입니다.

OBS에는 아래 URL을 Browser Source로 추가합니다.

```text
http://localhost:5173/#/overlay
```

오버레이 설정 화면은 아래 URL로 접근합니다.

```text
http://localhost:5173/#/overlay?settings=1
```

## 현재 표시 요소

- 방송 중일 때 선택된 AI 캐릭터 이미지
- AI 응답 텍스트 말풍선
- 현재 감정 상태에 따른 이미지 효과
- 위치 프리셋: 왼쪽/오른쪽, 위/아래
- 크기 조절: 50% ~ 150%
- 설정 화면의 OBS URL 복사 버튼

## 데이터 소스

- DashboardPage가 AI 응답 수신 시 `overlayStore.runtime` 갱신
- `overlayStore.settings`는 localStorage에 persist
- `overlayBridge`가 OBS Browser Source와 같은 origin의 별도 탭/브라우저 컨텍스트에 상태 전달
- 캐릭터 이미지는 현재 선택 캐릭터의 `characterImageUrl` 사용

## 동작 흐름

1. OBS에서 Browser Source를 `/overlay` URL로 추가
2. 앱에서 캐릭터 선택 후 방송 시작
3. `DashboardPage`가 방송 상태와 캐릭터 이미지 정보를 overlay runtime에 반영
4. AI 응답 수신 시 대사 텍스트가 overlay runtime에 반영
5. `/overlay` 화면은 bridge state를 받아 캐릭터 이미지와 말풍선을 표시
6. 방송 종료 또는 오버레이 OFF 시 화면에서 캐릭터 숨김

## 메모

- 향후 백엔드 WebSocket metadata에 `emotion` 필드가 추가되면 감정별 이미지 전환으로 확장합니다.
- OBS 자동 소스 추가/장면 제어는 현재 범위가 아니며, 필요 시 `obs-websocket` 연동으로 확장합니다.
