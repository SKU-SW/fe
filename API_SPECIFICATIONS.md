# SKU-SW 백엔드 API 명세서

> 최종 업데이트: 2025-04-21
> Spring Boot 백엔드 REST API 및 WebSocket 스펙

## 📋 목차

1. [API 개요](#api-개요)
2. [인증 (Authentication)](#1-인증-authentication)
3. [캐릭터 (Character)](#2-캐릭터-character)
4. [채팅 분석 (Chat Analysis)](#3-채팅-분석-chat-analysis)
5. [게임 (Game)](#4-게임-game)
6. [안전 관리 (Safety)](#5-안전-관리-safety)
7. [방송 통계 (Broadcast Statistics)](#6-방송-통계-broadcast-statistics)
8. [WebSocket](#7-websocket)
9. [에러 처리](#8-에러-처리)
10. [레이트 리미팅 & 보안](#9-레이트-리미팅--보안)

---

## API 개요

### 기본 정보

- **Base URL**: `http://localhost:8080`
- **API Version**: `v1`
- **Base Path**: `/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)

### 표준 응답 형식

모든 API 응답은 다음의 래퍼 형식을 따릅니다:

```json
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "성공 메시지 (옵션)",
  "timestamp": "2025-04-21T10:30:00Z"
}
```

### 표준 에러 응답

```json
{
  "success": false,
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "ERROR_CODE",
  "timestamp": "2025-04-21T10:30:00Z"
}
```

### HTTP 상태 코드

| 코드 | 설명 | 용도 |
|------|------|------|
| 200 | OK | 성공 |
| 201 | Created | 리소스 생성 성공 |
| 204 | No Content | 성공 (응답 본문 없음) |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 부족 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 (예: 중복 이메일) |
| 429 | Too Many Requests | 레이트 리미트 |
| 500 | Internal Server Error | 서버 에러 |

---

## 1. 인증 (Authentication)

### 1.1 이메일 회원가입

**엔드포인트**: `POST /api/v1/auth/register/email`

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "사용자이름"
}
```

**요청 헤더**:
```
Content-Type: application/json
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "사용자이름",
      "image": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  },
  "message": "회원가입 성공"
}
```

**에러 응답**:
- 400: 입력값 검증 실패 (이메일 형식, 비밀번호 강도)
- 409: 이미 가입된 이메일

**비밀번호 요구사항**:
- 최소 8글자
- 대문자, 소문자, 숫자, 특수문자 포함

---

### 1.2 이메일 로그인

**엔드포인트**: `POST /api/v1/auth/login/email`

**요청 본문**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "사용자이름",
      "image": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  },
  "message": "로그인 성공"
}
```

**에러 응답**:
- 401: 이메일 또는 비밀번호 불일치
- 404: 사용자 없음

---

### 1.3 Google OAuth2 콜백

**엔드포인트**: `POST /api/v1/auth/oauth/google/callback`

**요청 본문**:
```json
{
  "code": "authorization_code_from_google",
  "redirectUri": "http://localhost:5173/auth/callback"
}
```

**응답 (200 OK 또는 201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_456",
      "email": "user@gmail.com",
      "name": "Google User",
      "image": "https://lh3.googleusercontent.com/..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "isNewUser": true
  }
}
```

**에러 응답**:
- 400: 잘못된 인증 코드
- 500: Google API 통신 실패

---

### 1.4 토큰 재발급

**엔드포인트**: `POST /api/v1/auth/refresh`

**요청 본문**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**에러 응답**:
- 401: 유효하지 않은 또는 만료된 리프레시 토큰

---

### 1.5 로그아웃

**엔드포인트**: `POST /api/v1/auth/logout`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (204 No Content 또는 200 OK)**:
```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

**설명**:
- 서버 측에서 리프레시 토큰을 무효화
- 클라이언트에서는 로컬 스토리지 초기화 필요

---

## 2. 캐릭터 (Character)

### 2.1 캐릭터 설정 옵션 조회

**엔드포인트**: `GET /api/v1/characters/settings`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "genders": ["MALE", "FEMALE"],
    "speechTones": ["친근한 반말", "깍듯한 존댓말", "장난기 섞인 반말", "방송용 과장체"],
    "personalities": ["활발함", "차분함", "유머러스", "진지함"],
    "personas": ["게임 특화", "유머/예능", "진중/집중", "잡담/소통"],
    "appearances": [
      {
        "id": "appearance_1",
        "name": "남성 기본",
        "gender": "MALE",
        "previewUrl": "https://..."
      },
      {
        "id": "appearance_2",
        "name": "여성 기본",
        "gender": "FEMALE",
        "previewUrl": "https://..."
      }
    ],
    "voices": [
      {
        "id": "voice_1",
        "name": "남성음 1",
        "gender": "MALE",
        "language": "ko-KR",
        "sampleUrl": "https://..."
      },
      {
        "id": "voice_2",
        "name": "여성음 1",
        "gender": "FEMALE",
        "language": "ko-KR",
        "sampleUrl": "https://..."
      }
    ]
  }
}
```

**에러 응답**:
- 401: 인증 필요

---

### 2.2 캐릭터 생성

**엔드포인트**: `POST /api/v1/characters`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**요청 본문**:
```json
{
  "name": "AI 동료",
  "gender": "FEMALE",
  "appearanceId": "appearance_2",
  "voiceId": "voice_2",
  "speechTone": "친근한 반말",
  "personality": "유머러스",
  "persona": "유머/예능",
  "callWord": "동료",
  "broadcastSettings": {
    "chatReactionSensitivity": "HIGH",
    "silenceResponseFrequency": 30,
    "voiceSpeed": 1.0,
    "voiceVolume": 100
  }
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "char_123",
    "userId": "user_123",
    "name": "AI 동료",
    "gender": "FEMALE",
    "appearanceId": "appearance_2",
    "voiceId": "voice_2",
    "speechTone": "친근한 반말",
    "personality": "유머러스",
    "persona": "유머/예능",
    "callWord": "동료",
    "broadcastSettings": {
      "chatReactionSensitivity": "HIGH",
      "silenceResponseFrequency": 30,
      "voiceSpeed": 1.0,
      "voiceVolume": 100,
      "chatReactionEnabled": true,
      "silenceReactionEnabled": true
    },
    "isSelected": true,
    "createdAt": "2025-04-21T10:30:00Z",
    "updatedAt": "2025-04-21T10:30:00Z"
  },
  "message": "캐릭터 생성 성공"
}
```

**에러 응답**:
- 400: 입력값 검증 실패 (이름 길이 2-10글자 등)
- 401: 인증 필요
- 409: 같은 이름의 캐릭터 이미 존재

---

### 2.3 캐릭터 목록 조회

**엔드포인트**: `GET /api/v1/characters`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**:
```
?page=1&limit=20&sortBy=createdAt&order=DESC
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "char_123",
        "userId": "user_123",
        "name": "AI 동료",
        "gender": "FEMALE",
        "appearanceId": "appearance_2",
        "voiceId": "voice_2",
        "speechTone": "친근한 반말",
        "personality": "유머러스",
        "persona": "유머/예능",
        "callWord": "동료",
        "isSelected": true,
        "createdAt": "2025-04-21T10:30:00Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "limit": 20
  }
}
```

**에러 응답**:
- 401: 인증 필요

---

### 2.4 단일 캐릭터 조회

**엔드포인트**: `GET /api/v1/characters/{characterId}`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**경로 파라미터**:
- `characterId`: 캐릭터 ID (예: char_123)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "char_123",
    "userId": "user_123",
    "name": "AI 동료",
    "gender": "FEMALE",
    "appearanceId": "appearance_2",
    "voiceId": "voice_2",
    "speechTone": "친근한 반말",
    "personality": "유머러스",
    "persona": "유머/예능",
    "callWord": "동료",
    "broadcastSettings": {
      "chatReactionSensitivity": "HIGH",
      "silenceResponseFrequency": 30,
      "voiceSpeed": 1.0,
      "voiceVolume": 100,
      "chatReactionEnabled": true,
      "silenceReactionEnabled": true
    },
    "isSelected": true,
    "createdAt": "2025-04-21T10:30:00Z",
    "updatedAt": "2025-04-21T10:30:00Z"
  }
}
```

**에러 응답**:
- 401: 인증 필요
- 404: 캐릭터 없음

---

### 2.5 캐릭터 수정

**엔드포인트**: `PUT /api/v1/characters/{characterId}`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**요청 본문 (모든 필드 선택사항)**:
```json
{
  "name": "새로운 이름",
  "speechTone": "깍듯한 존댓말",
  "personality": "활발함",
  "broadcastSettings": {
    "chatReactionSensitivity": "MEDIUM",
    "silenceResponseFrequency": 60,
    "voiceSpeed": 1.2,
    "voiceVolume": 80
  }
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "char_123",
    "name": "새로운 이름",
    "speechTone": "깍듯한 존댓말",
    "personality": "활발함",
    "broadcastSettings": {
      "chatReactionSensitivity": "MEDIUM",
      "silenceResponseFrequency": 60,
      "voiceSpeed": 1.2,
      "voiceVolume": 80
    },
    "updatedAt": "2025-04-21T10:35:00Z"
  },
  "message": "캐릭터 수정 성공"
}
```

**에러 응답**:
- 400: 입력값 검증 실패
- 401: 인증 필요
- 404: 캐릭터 없음

---

### 2.6 캐릭터 삭제

**엔드포인트**: `DELETE /api/v1/characters/{characterId}`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (204 No Content)**:
```
(응답 본문 없음)
```

**에러 응답**:
- 401: 인증 필요
- 404: 캐릭터 없음

---

### 2.7 캐릭터 선택 (활성화)

**엔드포인트**: `PATCH /api/v1/characters/{characterId}/select`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "char_123",
    "isSelected": true
  },
  "message": "캐릭터 선택 성공"
}
```

**설명**:
- 기존 선택 캐릭터는 자동으로 비선택 처리
- 한 번에 하나의 캐릭터만 활성화

**에러 응답**:
- 401: 인증 필요
- 404: 캐릭터 없음

---

## 3. 채팅 분석 (Chat Analysis)

### 3.1 실시간 채팅 여론 분석

**엔드포인트**: `GET /api/v1/chat-analysis/sentiment?minutes=10`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**:
- `minutes`: 분석 대상 시간 (5-1440, 기본값: 10)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "positive": 45,
    "neutral": 30,
    "negative": 25,
    "totalMessages": 100,
    "analysisTime": "2025-04-21T10:30:00Z",
    "timeWindow": 10
  }
}
```

**설명**:
- 긍정: 응원, 좋아요, 칭찬 표현
- 중립: 일반 대화, 질문
- 부정: 비판, 불평, 혐오

---

### 3.2 채팅별 여론 표시

**엔드포인트**: `POST /api/v1/chat-analysis/classify`

**요청 본문**:
```json
{
  "message": "이 스트리머 정말 잘하네!",
  "context": "게임 플레이 중"
}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "이 스트리머 정말 잘하네!",
    "sentiment": "POSITIVE",
    "confidence": 0.95,
    "keywords": ["스트리머", "잘하다"]
  }
}
```

---

### 3.3 채팅 속도 통계

**엔드포인트**: `GET /api/v1/chat-analysis/speed?minutes=60`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "currentSpeed": 25,
    "averageSpeed": 20,
    "peakSpeed": 50,
    "unit": "messages/minute",
    "timeWindow": 60,
    "timestamps": [
      {
        "time": "2025-04-21T09:30:00Z",
        "speed": 15
      },
      {
        "time": "2025-04-21T09:35:00Z",
        "speed": 25
      }
    ]
  }
}
```

---

### 3.4 주요 키워드 조회

**엔드포인트**: `GET /api/v1/chat-analysis/keywords?limit=10`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**:
- `limit`: 조회할 키워드 개수 (기본값: 10)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "rank": 1,
        "word": "재미있다",
        "frequency": 45,
        "trend": "UP"
      },
      {
        "rank": 2,
        "word": "스트리머",
        "frequency": 38,
        "trend": "STABLE"
      },
      {
        "rank": 3,
        "word": "게임",
        "frequency": 32,
        "trend": "DOWN"
      }
    ],
    "totalKeywords": 150
  }
}
```

---

### 3.5 필터링된 채팅 통계

**엔드포인트**: `GET /api/v1/chat-analysis/filtered-statistics`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalFiltered": 15,
    "byReason": {
      "bannedWords": 8,
      "inappropriate": 4,
      "spam": 3
    },
    "filterRate": 3.5,
    "unit": "percentage"
  }
}
```

---

## 4. 게임 (Game)

### 4.1 게임 상태 조회 (Riot API 래핑)

**엔드포인트**: `GET /api/v1/game/live-data?puuid={puuid}`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**:
- `puuid`: 플레이어 PUUID (Riot API에서 제공)

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "isInGame": true,
    "gameMode": "CLASSIC",
    "gameName": "Ranked Solo/Duo",
    "gameStartTime": "2025-04-21T10:00:00Z",
    "playerTeam": {
      "player": {
        "summonerName": "Streamer123",
        "championName": "Ahri",
        "kills": 5,
        "deaths": 2,
        "assists": 8,
        "gold": 12500,
        "cs": 180,
        "level": 14
      },
      "allies": [
        {
          "summonerName": "AllyName1",
          "championName": "Garen",
          "kills": 3,
          "deaths": 1,
          "assists": 5
        }
      ]
    },
    "enemyTeam": [
      {
        "summonerName": "Enemy1",
        "championName": "Akali",
        "kills": 2,
        "deaths": 4,
        "assists": 3
      }
    ]
  }
}
```

**에러 응답**:
- 400: 유효하지 않은 PUUID
- 404: 게임 진행 중 아님
- 503: Riot API 통신 실패

---

### 4.2 게임 이벤트 구독 (WebSocket)

**엔드포인트**: WebSocket 섹션 참고 (7. WebSocket)

---

## 5. 안전 관리 (Safety)

### 5.1 금지어 목록 조회

**엔드포인트**: `GET /api/v1/safety/banned-words`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**:
```
?filterType=INPUT&page=1&limit=50
```

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "bannedWords": [
      {
        "id": "word_1",
        "word": "욕설1",
        "filterType": "INPUT",
        "replacementText": "****",
        "severity": "HIGH",
        "createdAt": "2025-04-21T10:00:00Z"
      }
    ],
    "totalCount": 50,
    "page": 1,
    "limit": 50
  }
}
```

---

### 5.2 커스텀 금지어 등록

**엔드포인트**: `POST /api/v1/safety/banned-words`

**요청 본문**:
```json
{
  "word": "커스텀금지어",
  "filterType": "INPUT",
  "replacementText": "****",
  "severity": "MEDIUM"
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "word_custom_1",
    "word": "커스텀금지어",
    "filterType": "INPUT",
    "replacementText": "****",
    "severity": "MEDIUM",
    "createdAt": "2025-04-21T10:30:00Z"
  }
}
```

---

### 5.3 커스텀 금지어 삭제

**엔드포인트**: `DELETE /api/v1/safety/banned-words/{wordId}`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**응답 (204 No Content)**:
```
(응답 본문 없음)
```

---

## 6. 방송 통계 (Broadcast Statistics)

### 6.1 특정 날짜 방송 통계

**엔드포인트**: `GET /api/v1/broadcast/statistics?date=2025-04-21&type=SUMMARY`

**요청 헤더**:
```
Authorization: Bearer {accessToken}
```

**쿼리 파라미터**:
- `date`: 조회 날짜 (YYYY-MM-DD)
- `type`: SUMMARY | DETAILED | TRANSCRIPT

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "date": "2025-04-21",
    "broadcastDuration": 3600,
    "statistics": {
      "totalMessages": 1000,
      "uniqueUsers": 250,
      "sentimentBreakdown": {
        "positive": 450,
        "neutral": 350,
        "negative": 200
      },
      "topKeywords": ["재미", "좋음", "스트리머"],
      "aiResponses": 45,
      "gameEvents": 12
    },
    "timeline": [
      {
        "timestamp": "2025-04-21T10:00:00Z",
        "event": "방송 시작",
        "details": {}
      }
    ]
  }
}
```

---

## 7. WebSocket

### 7.1 WebSocket 연결

**URL**: `ws://localhost:8080/api/v1/ws?token={accessToken}`

**프로토콜**: `json`

### 7.2 메시지 구조

모든 WebSocket 메시지는 JSON 형식:

```json
{
  "type": "MESSAGE_TYPE",
  "data": { /* 타입별 데이터 */ },
  "timestamp": "2025-04-21T10:30:00Z"
}
```

### 7.3 클라이언트 → 서버 메시지

#### 7.3.1 채팅 메시지 구독

```json
{
  "type": "SUBSCRIBE_CHAT",
  "data": {
    "channelId": "stream_123"
  }
}
```

#### 7.3.2 게임 이벤트 구독

```json
{
  "type": "SUBSCRIBE_GAME",
  "data": {
    "characterId": "char_123"
  }
}
```

#### 7.3.3 구독 해제

```json
{
  "type": "UNSUBSCRIBE",
  "data": {
    "subscriptionId": "sub_123"
  }
}
```

### 7.4 서버 → 클라이언트 메시지

#### 7.4.1 실시간 채팅 메시지

```json
{
  "type": "CHAT_MESSAGE",
  "data": {
    "messageId": "msg_123",
    "username": "user_name",
    "message": "채팅 내용",
    "sentiment": "POSITIVE",
    "timestamp": "2025-04-21T10:30:00Z"
  }
}
```

#### 7.4.2 게임 이벤트

```json
{
  "type": "GAME_EVENT",
  "data": {
    "eventType": "KILL",
    "champion": "Ahri",
    "details": {
      "kills": 5,
      "deaths": 2,
      "assists": 8
    },
    "timestamp": "2025-04-21T10:30:00Z"
  }
}
```

**이벤트 타입**: KILL, DEATH, ASSIST, MULTIKILL, BARON, DRAGON, TURRET, GAME_END

#### 7.4.3 채팅 여론 업데이트

```json
{
  "type": "SENTIMENT_UPDATE",
  "data": {
    "positive": 450,
    "neutral": 350,
    "negative": 200,
    "timeWindow": 10,
    "timestamp": "2025-04-21T10:30:00Z"
  }
}
```

#### 7.4.4 연결 상태

```json
{
  "type": "CONNECTION_STATUS",
  "data": {
    "status": "CONNECTED",
    "message": "연결 성공"
  }
}
```

### 7.5 WebSocket 에러

```json
{
  "type": "ERROR",
  "data": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "채팅 구독 실패",
    "details": {}
  }
}
```

---

## 8. 에러 처리

### 8.1 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|----------|
| INVALID_INPUT | 입력값 검증 실패 | 400 |
| UNAUTHORIZED | 인증 필요 | 401 |
| FORBIDDEN | 권한 부족 | 403 |
| NOT_FOUND | 리소스 없음 | 404 |
| DUPLICATE | 중복 데이터 | 409 |
| RATE_LIMITED | 요청 제한 초과 | 429 |
| SERVER_ERROR | 서버 에러 | 500 |
| SERVICE_UNAVAILABLE | 서비스 이용 불가 | 503 |

### 8.2 에러 응답 예시

```json
{
  "success": false,
  "statusCode": 400,
  "message": "이메일 형식이 올바르지 않습니다.",
  "error": "INVALID_INPUT",
  "details": {
    "field": "email",
    "value": "invalid-email"
  },
  "timestamp": "2025-04-21T10:30:00Z"
}
```

---

## 9. 레이트 리미팅 & 보안

### 9.1 레이트 리미팅

| 엔드포인트 | 제한 | 시간 |
|-----------|------|------|
| `/auth/register/email` | 5회 | 1시간 |
| `/auth/login/email` | 10회 | 1시간 |
| `/characters` (POST) | 50회 | 1시간 |
| `/chat-analysis/*` | 100회 | 1시간 |
| 기타 | 1000회 | 1시간 |

**레이트 리미트 헤더**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### 9.2 CORS

```
Access-Control-Allow-Origin: http://localhost:5173, http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### 9.3 보안 헤더

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### 9.4 데이터 검증

모든 입력값은 다음과 같이 검증됩니다:
- XSS 방지: HTML 특수문자 이스케이프
- SQL Injection 방지: Prepared Statement 사용
- CSRF 방지: CSRF 토큰 검증

---

## 🔗 API 통합 가이드

### 프런트엔드 구현

프런트엔드는 `src/features/*/api/` 에서 API 함수를 정의합니다:

```typescript
// src/features/auth/api/authApi.ts
export async function loginEmail(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login/email`, data);
  return res.data;
}

// src/features/auth/hooks/useLogin.ts
export function useLogin(): UseLoginReturn {
  const login = useCallback(async (data: LoginRequest) => {
    const response = await loginEmail(data);
    // JWT 토큰 자동으로 localStorage에 저장되고 인터셉터에서 주입됨
  }, []);
  return { login, isPending, error };
}
```

### Axios 인터셉터 (자동 토큰 주입)

```typescript
// src/shared/lib/axios.ts
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 401 Unauthorized 시 자동 토큰 재발급
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 재발급 로직
    }
    return Promise.reject(error);
  }
);
```

---

## 📝 변경 이력

| 버전 | 날짜 | 변경 사항 |
|------|------|---------|
| 1.0 | 2025-04-21 | 초본 작성 |

