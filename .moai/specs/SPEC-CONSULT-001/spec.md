---
id: CONSULT-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @Goos
priority: critical
category: feature
labels:
  - realtime
  - consultation
  - websocket
depends_on:
  - AUTH-001
  - MATCH-001
scope:
  packages:
    - src/features/consultation
    - src/lib/supabase/realtime
  files:
    - consultation-service.ts
    - message-manager.ts
    - file-upload.ts
---

# @SPEC:CONSULT-001: 실시간 상담 시스템

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: 실시간 상담 시스템 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: Supabase Realtime 기반 1:1 채팅, 메시지 관리, 파일 첨부
- **CONTEXT**: MVP Phase 1 - 교사와 변호사 간 실시간 상담 핵심 기능

---

## 개요

교사와 변호사 간 실시간 1:1 상담을 지원하는 WebSocket 기반 메시징 시스템입니다. Supabase Realtime을 활용하여 실시간 메시지 전송, 읽음 상태 관리, 파일 첨부, 온라인 상태 표시를 제공합니다.

## 핵심 목표

- 지연 없는 실시간 메시지 전송 (WebSocket)
- 메시지 이력 영구 보관 (PostgreSQL)
- 안정적인 파일 첨부 (Supabase Storage)
- 네트워크 장애 시 자동 재전송
- 직관적인 채팅 UX

---

## EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)

- 시스템은 교사와 변호사 간 1:1 실시간 메시지 전송 기능을 제공해야 한다
- 시스템은 모든 메시지를 데이터베이스에 영구 저장해야 한다
- 시스템은 메시지 읽음/안읽음 상태 관리를 제공해야 한다
- 시스템은 파일 첨부 기능을 제공해야 한다 (5MB/파일, 최대 5개)
- 시스템은 상대방의 온라인 상태를 실시간으로 표시해야 한다
- 시스템은 메시지 전송 실패 시 재전송 로직을 제공해야 한다

### Event-driven Requirements (이벤트 기반)

- WHEN 사용자가 메시지를 전송하면, 시스템은 즉시 WebSocket으로 전송해야 한다
- WHEN 메시지 전송이 실패하면, 시스템은 최대 3회까지 재전송을 시도해야 한다
- WHEN 상대방이 메시지를 읽으면, 시스템은 읽음 상태를 업데이트하고 발신자에게 알려야 한다
- WHEN 사용자가 파일을 첨부하면, 시스템은 Supabase Storage에 업로드하고 URL을 메시지에 포함해야 한다
- WHEN 상대방이 온라인 상태가 변경되면, 시스템은 presence 정보를 실시간으로 업데이트해야 한다
- WHEN 네트워크 연결이 끊어지면, 시스템은 재연결을 자동으로 시도해야 한다
- WHEN 재연결에 성공하면, 시스템은 누락된 메시지를 동기화해야 한다

### State-driven Requirements (상태 기반)

- WHILE 사용자가 채팅방에 있을 때, 시스템은 실시간으로 새 메시지를 수신해야 한다
- WHILE 파일 업로드가 진행 중일 때, 시스템은 진행률을 표시해야 한다
- WHILE 메시지 전송 중일 때, 시스템은 전송 중 상태를 UI에 표시해야 한다
- WHILE 상대방이 입력 중일 때, 시스템은 "입력 중..." 표시를 보여줘야 한다

### Optional Features (선택적 기능)

- WHERE 사용자가 요청하면, 시스템은 메시지 검색 기능을 제공할 수 있다
- WHERE 사용자가 요청하면, 시스템은 메시지 삭제 기능을 제공할 수 있다
- WHERE 사용자가 요청하면, 시스템은 알림음 설정을 변경할 수 있다
- WHERE 메시지 양이 많으면, 시스템은 무한 스크롤 페이징을 제공할 수 있다

### Constraints (제약사항)

- IF 메시지 길이가 5000자를 초과하면, 시스템은 전송을 거부해야 한다
- IF 파일 크기가 5MB를 초과하면, 시스템은 업로드를 거부해야 한다
- IF 첨부 파일 개수가 5개를 초과하면, 시스템은 추가 업로드를 막아야 한다
- IF 사용자가 인증되지 않았으면, 시스템은 채팅방 접근을 거부해야 한다
- IF 매칭이 완료되지 않았으면, 시스템은 상담 시작을 허용하지 않아야 한다
- 메시지 전송 실패 시 재전송 횟수는 3회를 초과하지 않아야 한다
- WebSocket 연결 타임아웃은 30초를 초과하지 않아야 한다
- 메시지 동기화 간격은 5초를 초과하지 않아야 한다

---

## 기술 스택

### 실시간 통신
- **Supabase Realtime**: WebSocket 기반 실시간 메시지 전송
- **PostgreSQL**: 메시지 영구 저장 및 이력 관리
- **React Query**: 서버 상태 관리 및 캐싱

### 파일 관리
- **Supabase Storage**: 파일 업로드/다운로드
- **File API**: 브라우저 파일 선택 및 검증

### 상태 관리
- **Zustand**: 채팅 UI 상태, 입력 중 상태
- **Supabase Presence**: 온라인 상태 추적

---

## 데이터 모델

### consultations 테이블
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

### messages 테이블
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

### 첨부 파일 JSONB 구조
```typescript
interface Attachment {
  id: string;
  name: string;
  size: number; // bytes
  url: string;  // Supabase Storage URL
  mime_type: string;
  uploaded_at: string;
}
```

---

## 핵심 시나리오

### 1. 메시지 전송
1. 사용자가 메시지 입력 후 전송 버튼 클릭
2. 클라이언트가 메시지 길이 검증 (≤5000자)
3. Supabase Realtime으로 메시지 전송
4. PostgreSQL에 메시지 저장
5. 수신자에게 실시간 메시지 전달
6. 발신자에게 전송 완료 피드백

### 2. 파일 첨부
1. 사용자가 파일 선택
2. 클라이언트가 파일 크기 검증 (≤5MB, 최대 5개)
3. Supabase Storage에 업로드 (진행률 표시)
4. 업로드 완료 후 URL 획득
5. 메시지에 첨부 파일 정보 포함하여 전송

### 3. 읽음 상태 관리
1. 수신자가 메시지 조회
2. 클라이언트가 `is_read = TRUE` 업데이트
3. 발신자에게 읽음 상태 변경 알림

### 4. 재전송 로직
1. 메시지 전송 실패 감지
2. 재전송 횟수 확인 (retry_count < 3)
3. 지수 백오프로 재전송 (1s → 2s → 4s)
4. 3회 실패 시 사용자에게 에러 표시

---

## 성능 요구사항

- **메시지 전송 지연**: 1초 이내
- **WebSocket 연결 설정**: 3초 이내
- **파일 업로드 속도**: 5MB 파일 기준 10초 이내
- **메시지 동기화**: 재연결 후 5초 이내 완료
- **초기 메시지 로딩**: 최근 50개 메시지 2초 이내

---

## 보안 요구사항

- 인증된 사용자만 채팅방 접근 가능 (JWT 검증)
- 매칭된 교사-변호사 페어만 상담 가능 (RLS 정책)
- 파일 업로드 시 MIME 타입 검증 (허용: image/*, application/pdf)
- XSS 방지: 메시지 내용 HTML 이스케이프
- 첨부 파일 URL 서명 검증 (Supabase Storage)

---

## 예외 처리

### 네트워크 오류
- 연결 끊김 감지 후 자동 재연결
- 재연결 실패 시 사용자에게 알림

### 메시지 전송 실패
- 3회 재전송 후 실패 시 에러 표시
- 실패한 메시지는 로컬에 임시 저장

### 파일 업로드 실패
- 업로드 실패 시 재시도 옵션 제공
- 네트워크 상태 확인 후 재시도

---

## 테스트 전략

### 단위 테스트
- 메시지 검증 로직 (길이, 형식)
- 파일 검증 로직 (크기, 타입, 개수)
- 재전송 로직 (횟수, 백오프)

### 통합 테스트
- Supabase Realtime 구독/발행
- 메시지 저장 및 조회
- 파일 업로드 및 URL 생성

### E2E 테스트
- 교사-변호사 실시간 채팅 플로우
- 파일 첨부 및 다운로드
- 네트워크 장애 시나리오

---

## 추적성

- **@TEST:CONSULT-001**: tests/consultation/realtime.test.ts
- **@CODE:CONSULT-001**: src/features/consultation/
- **@DOC:CONSULT-001**: docs/consultation.md

---

## 관련 SPEC

- **AUTH-001**: 사용자 인증 (JWT 검증 필요)
- **MATCH-001**: 교사-변호사 매칭 (매칭 완료 후 상담 시작)

---

**문서 버전**: v0.0.1
**최종 수정일**: 2025-10-20
**작성자**: @Goos
