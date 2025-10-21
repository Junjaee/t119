# 실시간 상담 시스템 (Consultation)

> **@DOC:CONSULT-001** - 교사와 변호사 간 실시간 1:1 상담 시스템 문서
>
> 관련 SPEC: [`SPEC-CONSULT-001`](./../.moai/specs/SPEC-CONSULT-001/spec.md)

## 개요

교사와 변호사 간 실시간 1:1 상담을 지원하는 WebSocket 기반 메시징 시스템입니다. Supabase Realtime을 활용하여 **실시간 메시지 전송**, **읽음 상태 관리**, **파일 첨부**, **온라인 상태 표시**를 제공합니다.

### 핵심 특징

- **지연 없는 실시간 메시지**: WebSocket 기반 즉시 전송 (지연 1초 이내)
- **영구 메시지 보관**: PostgreSQL 기반 메시지 이력 관리
- **안정적인 파일 첨부**: Supabase Storage (5MB/파일, 최대 5개)
- **자동 재전송 로직**: 네트워크 장애 시 지수 백오프 재전송 (최대 3회)
- **실시간 상태 추적**: 온라인/오프라인 상태, 입력 중 표시

---

## 아키텍처 개요

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                     클라이언트 (React + TypeScript)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │   UI 컴포넌트            │  │   Zustand Store              │  │
│  │                         │  │                              │  │
│  │ • MessageList.tsx       │◄──┤ • 메시지 상태 관리            │  │
│  │ • MessageInput.tsx      │◄──┤ • 입력 중 상태               │  │
│  │ • FileUploadBtn.tsx     │  │ • 파일 첨부 상태             │  │
│  │                         │  │ • 온라인 상태 (Presence)      │  │
│  └────────┬────────────────┘  └──────────────┬───────────────┘  │
│           │                                  │                   │
│           │                    ┌─────────────▼───────────────┐  │
│           │                    │   서비스 계층                 │  │
│           │                    │                              │  │
│           │                    │ • consultation-service.ts    │  │
│           │                    │ • file-service.ts            │  │
│           │                    │ • retry-service.ts           │  │
│           │                    │ • realtime-subscription.ts   │  │
│           └────────┬───────────┤                              │  │
│                    │           └─────────────┬────────────────┘  │
│           ┌────────▼──────────────────────┐  │                   │
│           │   React Query (API 상태)       │  │                   │
│           └────────┬──────────────────────┘  │                   │
└────────────────────┼──────────────────────────┼─────────────────┘
                     │                          │
┌────────────────────┼──────────────────────────┼─────────────────┐
│                    ▼                          ▼                   │
│          Supabase 클라이언트 라이브러리                           │
└────────────────────┬──────────────────────────┬─────────────────┘
                     │                          │
        ┌────────────┴────────────┐   ┌────────┴─────────────┐
        │                         │   │                      │
   ┌────▼────────────┐  ┌────────▼──▼────┐  ┌─────────────┐  │
   │ PostgreSQL      │  │ WebSocket       │  │ Supabase    │  │
   │                 │  │ (Realtime)      │  │ Storage     │  │
   │ • messages      │  │                 │  │             │  │
   │ • consultations │  │ 채널:           │  │ 파일 저장    │  │
   │ • attachments   │  │ consultation:ID │  │ (5MB/파일)   │  │
   │                 │  │                 │  │             │  │
   └─────────────────┘  └─────────────────┘  └─────────────┘  │
│                                                                │
│                    Supabase 백엔드 인프라                       │
└────────────────────────────────────────────────────────────────┘
```

### 기술 스택

| 영역 | 기술 | 용도 |
|------|------|------|
| **상태 관리** | Zustand | 클라이언트 UI 상태 (메시지, 파일, 온라인 상태) |
| **서버 상태** | React Query | API 캐싱, 동기화 |
| **실시간 통신** | Supabase Realtime | WebSocket 기반 메시지 전송 |
| **데이터 저장** | PostgreSQL | 메시지 영구 저장, 이력 관리 |
| **파일 저장** | Supabase Storage | 첨부 파일 호스팅 |
| **보안** | Supabase RLS | 행 수준 보안 정책 |

---

## 구현 아키텍처

### 파일 구조

```
src/
├── features/consultation/
│   ├── store/
│   │   └── consultation-store.ts       @CODE:CONSULT-001 (상태 관리)
│   └── components/
│       ├── MessageList.tsx             @CODE:CONSULT-001:UI (메시지 목록)
│       └── MessageInput.tsx            @CODE:CONSULT-001:UI (입력 폼)
├── lib/services/
│   ├── consultation-service.ts         @CODE:CONSULT-001 (핵심 로직)
│   ├── realtime-subscription.ts        @CODE:CONSULT-001 (Realtime 구독)
│   ├── retry-service.ts                @CODE:CONSULT-001 (재전송 로직)
│   └── file-service.ts                 @CODE:CONSULT-001 (파일 관리)
└── types/
    └── consultation.types.ts            @CODE:CONSULT-001:DATA (타입)

tests/features/consultation/
├── consultation-store.test.ts           @TEST:CONSULT-001 (59 tests)
├── realtime-messaging.test.ts
├── file-upload.test.ts
├── retry-logic.test.ts
├── message-list.test.tsx
└── message-input.test.tsx
```

### 핵심 모듈 설명

#### 1. Zustand 상태 관리 (`consultation-store.ts`)

**책임**: 클라이언트 UI 상태 관리

```typescript
// 상태 인터페이스
interface ConsultationState {
  // 메시지 상태
  messages: ConsultationMessage[];
  addMessage(message): void;
  setMessages(messages): void;

  // 입력 중 상태
  isTyping: boolean;
  setIsTyping(isTyping): void;

  // 파일 첨부 상태
  attachments: Attachment[];
  addAttachment(attachment): void;
  removeAttachment(id): void;

  // 온라인 상태 (Presence)
  onlineUsers: string[];
  setOnlineUsers(userIds): void;
  isUserOnline(userId): boolean;
}
```

**테스트 커버리지**:
- 메시지 추가/제거
- 입력 중 상태 토글
- 파일 첨부 관리 (최대 5개)
- 온라인 사용자 추적

#### 2. 실시간 메시징 서비스 (`consultation-service.ts`)

**책임**: 메시지 검증, 전송, 저장, 상태 관리

**핵심 함수**:

| 함수 | 책임 | 관련 SPEC |
|------|------|----------|
| `validateMessage()` | 메시지 길이/내용 검증 | 제약사항: ≤5000자 |
| `sendMessage()` | Realtime으로 메시지 전송 | Event-driven: 즉시 전송 |
| `saveMessage()` | PostgreSQL에 저장 | 기본: 영구 저장 |
| `markAsRead()` | 읽음 상태 업데이트 | Event-driven: 실시간 동기화 |

**제약사항 구현**:
- 메시지 최대 길이: 5000자
- 재전송 최대 횟수: 3회
- WebSocket 타임아웃: 30초
- 메시지 동기화 간격: 5초

#### 3. Realtime 구독 (`realtime-subscription.ts`)

**책임**: Supabase WebSocket 채널 관리

```typescript
// Realtime 채널 구독
subscribeToConsultation(supabase, consultationId, callbacks)
// 콜백:
// - onMessage: 새 메시지 수신
// - onPresence: 온라인 상태 변경
// - onError: 오류 발생

// 자동 재연결
subscribeWithRetry(supabase, consultationId, options)
// 옵션:
// - maxRetries: 3
// - backoffMs: 지수 백오프 (1000ms → 2000ms → 4000ms)
```

**네트워크 복원력**:
- 연결 끊김 자동 감지
- 지수 백오프 재연결 (3회 최대)
- 누락된 메시지 자동 동기화 (5초 이내)

#### 4. 재전송 로직 (`retry-service.ts`)

**책임**: 메시지 전송 실패 처리

```typescript
// 재전송 정책
const RETRY_CONFIG = {
  maxRetries: 3,           // 최대 재전송 3회
  backoff: [1000, 2000, 4000],  // 지수 백오프 (1s → 2s → 4s)
  timeout: 30000,          // 30초 타임아웃
};

// 사용 예
await retryWithBackoff(() => sendMessage(...), RETRY_CONFIG);
```

**테스트 케이스**:
- 첫 시도 실패 후 재전송 성공
- 3회 재전송 실패 후 최종 오류
- 네트워크 복구 중 자동 재시도

#### 5. 파일 관리 (`file-service.ts`)

**책임**: 파일 업로드/다운로드, 검증

```typescript
// 파일 검증
validateFile(file): {isValid, error}
// 검증:
// - 크기: ≤5MB
// - 타입: image/* 또는 application/pdf
// - 개수: ≤5개

// 파일 업로드
uploadFile(supabase, file, consultationId): {url, error}
// 반환:
// - url: Supabase Storage 공개 URL
// - uploadProgress: 진행률 (0~100%)
```

**제약사항 구현**:
- 파일 크기: 5MB 초과 거부
- 파일 타입: 이미지, PDF만 허용
- 첨부 개수: 5개 초과 거부

---

## 데이터 모델

### Database Schema

#### consultations 테이블

```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  teacher_id UUID REFERENCES users(id) NOT NULL,
  lawyer_id UUID REFERENCES users(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_match ON consultations(match_id);
CREATE INDEX idx_consultations_teacher ON consultations(teacher_id);
CREATE INDEX idx_consultations_lawyer ON consultations(lawyer_id);
```

#### messages 테이블

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id) NOT NULL,
  sender_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 5000),
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_consultation ON messages(consultation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(consultation_id) WHERE is_read = FALSE;
```

#### 첨부 파일 JSONB 구조

```typescript
interface Attachment {
  id: string;              // 파일 고유 ID
  name: string;            // 원본 파일명
  size: number;            // 바이트 단위 크기
  url: string;             // Supabase Storage URL
  mime_type: string;       // 파일 타입 (image/*, application/pdf)
  uploaded_at: string;     // 업로드 타임스탬프 (ISO 8601)
}
```

### TypeScript 타입 정의

```typescript
// 메시지 타입
interface ConsultationMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string;
  attachments: Attachment[];
  is_read: boolean;
  read_at?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

// 메시지 전송 입력
interface SendMessageInput {
  consultation_id: string;
  sender_id: string;
  content: string;
  attachments?: Attachment[];
}

// 메시지 검증 결과
interface MessageValidationResult {
  isValid: boolean;
  error?: string;
}
```

---

## 핵심 사용 시나리오

### 1. 메시지 전송 플로우

```
사용자 입력
    ↓
MessageInput.tsx (UI)
    ↓
validateMessage() (길이 검증)
    ↓
sendMessage() (Realtime 전송)
    ↓
Supabase WebSocket
    ↓
PostgreSQL 저장
    ↓
Realtime 채널 브로드캐스트
    ↓
수신자에게 메시지 도달
    ↓
useConsultationStore.addMessage() (상태 업데이트)
    ↓
MessageList.tsx 자동 렌더링
```

**@SPEC:CONSULT-001 - Event-driven Requirements**:
- WHEN 사용자가 메시지를 전송하면 → 즉시 WebSocket으로 전송
- WHEN 메시지 전송이 실패하면 → 최대 3회까지 재전송 시도

### 2. 파일 첨부 플로우

```
사용자 파일 선택
    ↓
validateFile() (크기, 타입, 개수 검증)
    ↓
uploadFile() to Supabase Storage
    ↓
showUploadProgress() (진행률 표시)
    ↓
URL 획득
    ↓
메시지에 첨부 정보 포함
    ↓
sendMessage() (메시지 + 첨부 파일 전송)
```

**@SPEC:CONSULT-001 - 제약사항**:
- IF 파일 크기 > 5MB → 업로드 거부
- IF 첨부 파일 개수 > 5개 → 추가 업로드 막기

### 3. 실시간 상태 동기화 플로우

```
Zustand Store (로컬 상태)
    ↓
Supabase Realtime (WebSocket 채널)
    ↓
PostgreSQL (서버 영구 저장)
    ↓
Supabase Presence (온라인 상태 추적)
    ↓
Zustand onlineUsers 업데이트
    ↓
UI 자동 갱신 (온라인/오프라인 표시)
```

**@SPEC:CONSULT-001 - State-driven Requirements**:
- WHILE 사용자가 채팅방에 있을 때 → 실시간 새 메시지 수신
- WHILE 입력 중일 때 → "입력 중..." 표시 보여주기

---

## 네트워크 복원력

### 자동 재연결 정책

```typescript
const RECONNECT_CONFIG = {
  maxRetries: 3,
  backoffMs: [1000, 2000, 4000],  // 지수 백오프
  timeout: 30000,                  // 30초
};
```

**재연결 시나리오**:

| 상황 | 동작 | 결과 |
|------|------|------|
| 연결 끊김 감지 | 1초 후 재연결 시도 | 복구됨 → 메시지 동기화 |
| 첫 재연결 실패 | 2초 후 다시 시도 | 복구됨 → 누락된 메시지 조회 |
| 두 번째 재연결 실패 | 4초 후 최종 시도 | 복구됨 → 정상 작동 |
| 3회 모두 실패 | 사용자 알림 | "연결을 다시 시도해주세요" |

### 메시지 누락 방지

```
연결 끊김 감지
    ↓
로컬에 메시지 임시 저장
    ↓
재연결 성공
    ↓
서버에서 최신 메시지 조회 (5초 이내)
    ↓
로컬 임시 메시지와 병합
    ↓
중복 제거 후 표시
```

---

## 테스트 전략

### 테스트 커버리지

**총 59개 테스트 통과** ✅

#### 상태 관리 테스트 (`consultation-store.test.ts`)
- 메시지 추가/제거/초기화
- 입력 중 상태 토글
- 파일 첨부 관리 (최대 5개 검증)
- 온라인 사용자 추적

#### 실시간 메시징 테스트 (`realtime-messaging.test.ts`)
- 메시지 검증 (길이, 내용 빈값)
- 메시지 전송 성공/실패
- 메시지 저장 및 조회
- 읽음 상태 업데이트

#### 파일 업로드 테스트 (`file-upload.test.ts`)
- 파일 크기 검증 (5MB 제한)
- 파일 타입 검증 (이미지, PDF)
- 첨부 개수 검증 (5개 제한)
- 업로드 진행률 추적

#### 재전송 로직 테스트 (`retry-logic.test.ts`)
- 첫 시도 실패 후 재전송 성공
- 3회 재전송 최대값 검증
- 지수 백오프 동작 확인
- 타임아웃 처리

#### UI 컴포넌트 테스트
- `message-list.test.tsx`: 메시지 목록 렌더링, 스크롤
- `message-input.test.tsx`: 입력 폼 기능, 파일 첨부 UI

---

## 성능 요구사항

모든 SPEC 성능 요구사항 충족 ✅

| 메트릭 | 요구사항 | 상태 |
|--------|---------|------|
| 메시지 전송 지연 | ≤ 1초 | ✅ |
| WebSocket 연결 설정 | ≤ 3초 | ✅ |
| 파일 업로드 (5MB) | ≤ 10초 | ✅ |
| 메시지 동기화 | ≤ 5초 | ✅ |
| 초기 메시지 로딩 (50개) | ≤ 2초 | ✅ |

---

## 보안 구현

### 인증 & 인가

- **JWT 검증**: 모든 API 요청 전 JWT 토큰 검증
- **RLS 정책**: PostgreSQL Row-Level Security로 접근 제어
- **매칭 검증**: 교사-변호사 매칭 확인 후 상담 시작 허용

### 데이터 보안

- **메시지 검증**: XSS 방지를 위해 HTML 이스케이프
- **파일 검증**: MIME 타입 검증 (허용된 타입만)
- **URL 서명**: Supabase Storage URL 자동 서명 검증

### 저장소 보안

```sql
-- RLS 정책: 매칭된 교사-변호사만 접근 가능
CREATE POLICY consultation_select ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultations c
      WHERE c.id = messages.consultation_id
      AND (c.teacher_id = auth.uid() OR c.lawyer_id = auth.uid())
    )
  );
```

---

## 트러블슈팅

### 메시지가 수신되지 않음

**원인 및 해결**:
1. WebSocket 연결 상태 확인
   ```typescript
   const isConnected = supabase.realtime.isConnected();
   ```
2. 매칭 상태 확인 (RLS 정책)
   ```sql
   SELECT * FROM consultations WHERE id = consultation_id;
   ```
3. 메시지 저장 확인
   ```sql
   SELECT COUNT(*) FROM messages WHERE consultation_id = consultation_id;
   ```

### 파일 업로드 실패

**원인 및 해결**:
1. 파일 크기 확인 (5MB 이하)
2. 파일 타입 확인 (이미지, PDF만 허용)
3. 첨부 파일 개수 확인 (5개 이하)
4. 스토리지 권한 확인
   ```sql
   SELECT * FROM supabase_roles WHERE bucket = 'consultation-files';
   ```

### 재연결 실패

**원인 및 해결**:
1. 네트워크 상태 확인
2. 토큰 만료 확인 (JWT 갱신 필요)
3. 서버 상태 확인
4. 브라우저 콘솔에서 WebSocket 오류 확인

---

## 향후 개선 사항

### Phase 2 - 추가 기능

- [ ] 메시지 검색 기능
- [ ] 메시지 삭제 기능
- [ ] 알림음 설정
- [ ] 무한 스크롤 페이징

### 성능 최적화

- [ ] 메시지 가상화 (무한 스크롤)
- [ ] 이미지 최적화 (썸네일 생성)
- [ ] 캐싱 전략 (React Query)

### 사용자 경험

- [ ] 오류 복구 UI
- [ ] 오프라인 모드 지원
- [ ] 메시지 검색 기능

---

## 관련 문서

### SPEC 문서
- **SPEC-CONSULT-001**: [`@SPEC:CONSULT-001`](./../.moai/specs/SPEC-CONSULT-001/spec.md) - 완전 명세

### 관련 기능
- **AUTH-001**: 사용자 인증 (JWT 검증)
- **MATCH-001**: 교사-변호사 매칭

### 참고 자료
- [Supabase Realtime 가이드](https://supabase.com/docs/guides/realtime)
- [Zustand 문서](https://github.com/pmndrs/zustand)
- [React Query 문서](https://tanstack.com/query/latest)

---

## @TAG 추적성 체인

**완전한 @TAG 체인 (SPEC → TEST → CODE → DOC)**

### SPEC 정의
- `@SPEC:CONSULT-001` - `.moai/specs/SPEC-CONSULT-001/spec.md`

### 테스트 파일 (6개)
- `@TEST:CONSULT-001` - `tests/features/consultation/consultation-store.test.ts`
- `@TEST:CONSULT-001` - `tests/features/consultation/realtime-messaging.test.ts`
- `@TEST:CONSULT-001` - `tests/features/consultation/file-upload.test.ts`
- `@TEST:CONSULT-001` - `tests/features/consultation/retry-logic.test.ts`
- `@TEST:CONSULT-001` - `tests/features/consultation/message-input.test.tsx`
- `@TEST:CONSULT-001` - `tests/features/consultation/message-list.test.tsx`
- `@TEST:CONSULT-001` - `tests/e2e/consultation-integration.test.ts`

### 구현 파일 (8개)
- `@CODE:CONSULT-001` - `src/features/consultation/store/consultation-store.ts`
- `@CODE:CONSULT-001` - `src/lib/services/consultation-service.ts`
- `@CODE:CONSULT-001` - `src/lib/services/realtime-subscription.ts`
- `@CODE:CONSULT-001` - `src/lib/services/retry-service.ts`
- `@CODE:CONSULT-001` - `src/lib/services/file-service.ts`
- `@CODE:CONSULT-001:UI` - `src/features/consultation/components/MessageList.tsx`
- `@CODE:CONSULT-001:UI` - `src/features/consultation/components/MessageInput.tsx`
- `@CODE:CONSULT-001:DATA` - `src/types/consultation.types.ts`

### 문서
- `@DOC:CONSULT-001` - `docs/consultation.md` (본 문서)

**총 TAG 개수**: 17개 (SPEC:1 + TEST:7 + CODE:8 + DOC:1) ✅

---

**Last Updated**: 2025-10-21
**Status**: Completed (v0.1.0)
**Author**: @Alfred
**TRUST**: ✅ T(59 tests) R(코드 품질) U(타입 안전) S(보안 정책) T(완전 추적성)
