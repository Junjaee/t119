# SPEC-CONSULT-001 구현 계획서

## 개요

실시간 상담 시스템 구현을 위한 단계별 계획입니다. Supabase Realtime, PostgreSQL, Supabase Storage를 활용하여 안정적이고 확장 가능한 채팅 시스템을 구축합니다.

---

## 마일스톤

### 1차 목표: 핵심 메시징 기능 (Critical)

**범위**:
- Supabase Realtime 연결 설정
- 메시지 전송/수신 기능
- 메시지 영구 저장 (PostgreSQL)
- 기본 UI 컴포넌트

**산출물**:
- `consultation-service.ts`: Realtime 구독/발행 서비스
- `message-manager.ts`: 메시지 CRUD 로직
- `ChatRoom.tsx`: 채팅방 UI 컴포넌트
- `MessageList.tsx`: 메시지 목록 렌더링
- `MessageInput.tsx`: 메시지 입력 폼

**검증 기준**:
- 메시지 전송 후 1초 이내 수신 확인
- 페이지 새로고침 후 메시지 이력 유지
- 50개 메시지 로딩 2초 이내

**의존성**:
- AUTH-001 (JWT 인증 필요)
- MATCH-001 (매칭 ID 필요)

---

### 2차 목표: 읽음 상태 및 온라인 상태 (High)

**범위**:
- 읽음/안읽음 상태 관리
- 읽음 상태 실시간 동기화
- Supabase Presence 기반 온라인 상태
- "입력 중..." 표시

**산출물**:
- `read-status-manager.ts`: 읽음 상태 로직
- `presence-service.ts`: 온라인 상태 추적
- `TypingIndicator.tsx`: 입력 중 표시 컴포넌트
- `OnlineStatus.tsx`: 온라인 상태 표시

**검증 기준**:
- 메시지 읽음 시 1초 이내 발신자에게 알림
- 온라인 상태 변경 3초 이내 반영
- 입력 중 표시 지연 500ms 이내

---

### 3차 목표: 파일 첨부 기능 (High)

**범위**:
- Supabase Storage 업로드
- 파일 크기/개수 검증
- 업로드 진행률 표시
- 파일 다운로드

**산출물**:
- `file-upload.ts`: 파일 업로드 로직
- `file-validator.ts`: 파일 검증 (크기, 타입, 개수)
- `FileUploader.tsx`: 파일 선택 및 업로드 UI
- `AttachmentList.tsx`: 첨부 파일 목록 렌더링

**검증 기준**:
- 5MB 파일 업로드 10초 이내 완료
- 진행률 표시 정확도 ±5% 이내
- 파일 개수/크기 초과 시 즉시 에러 표시

---

### 4차 목표: 재전송 및 에러 처리 (Medium)

**범위**:
- 메시지 전송 실패 감지
- 재전송 로직 (최대 3회)
- 네트워크 재연결
- 누락 메시지 동기화

**산출물**:
- `retry-manager.ts`: 재전송 로직 (지수 백오프)
- `network-monitor.ts`: 네트워크 상태 감지
- `sync-service.ts`: 메시지 동기화
- `ErrorBoundary.tsx`: 에러 경계 컴포넌트

**검증 기준**:
- 재전송 성공률 95% 이상
- 재연결 후 5초 이내 메시지 동기화
- 네트워크 오류 시 사용자에게 명확한 피드백

---

### 5차 목표: 최적화 및 보안 (Medium)

**범위**:
- 메시지 무한 스크롤 페이징
- XSS 방지 (HTML 이스케이프)
- RLS 정책 설정
- 성능 모니터링

**산출물**:
- `pagination.ts`: 무한 스크롤 로직
- `security.ts`: XSS 방지, 입력 검증
- RLS 정책 SQL 스크립트
- 성능 모니터링 설정

**검증 기준**:
- 무한 스크롤 로딩 1초 이내
- XSS 공격 시나리오 차단 100%
- RLS 정책 누락 없음

---

## 기술적 접근 방법

### 1. Supabase Realtime 활용

**구독 설정**:
```typescript
const channel = supabase
  .channel(`consultation:${consultationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `consultation_id=eq.${consultationId}`
  }, handleNewMessage)
  .subscribe();
```

**발행 방법**:
```typescript
await supabase.from('messages').insert({
  consultation_id: consultationId,
  sender_id: userId,
  content: message,
  attachments: []
});
```

### 2. 메시지 재전송 로직

**지수 백오프 구현**:
```typescript
async function sendWithRetry(message: Message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await supabase.from('messages').insert(message);
      return { success: true };
    } catch (error) {
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await sleep(delay);
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}
```

### 3. 파일 업로드 진행률

**Progress Event 활용**:
```typescript
const { data, error } = await supabase.storage
  .from('attachments')
  .upload(filePath, file, {
    onUploadProgress: (progress) => {
      const percent = (progress.loaded / progress.total) * 100;
      setUploadProgress(percent);
    }
  });
```

### 4. 읽음 상태 Optimistic Update

**React Query Mutation**:
```typescript
const markAsReadMutation = useMutation({
  mutationFn: (messageId: string) =>
    supabase.from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId),
  onMutate: async (messageId) => {
    // Optimistic update
    await queryClient.cancelQueries(['messages']);
    const prev = queryClient.getQueryData(['messages']);
    queryClient.setQueryData(['messages'], (old: Message[]) =>
      old.map(m => m.id === messageId ? { ...m, is_read: true } : m)
    );
    return { prev };
  }
});
```

---

## 아키텍처 설계

### 디렉토리 구조
```
src/features/consultation/
├── components/
│   ├── ChatRoom.tsx
│   ├── MessageList.tsx
│   ├── MessageInput.tsx
│   ├── FileUploader.tsx
│   ├── AttachmentList.tsx
│   ├── TypingIndicator.tsx
│   └── OnlineStatus.tsx
├── services/
│   ├── consultation-service.ts
│   ├── message-manager.ts
│   ├── file-upload.ts
│   ├── retry-manager.ts
│   ├── presence-service.ts
│   └── sync-service.ts
├── hooks/
│   ├── useRealtime.ts
│   ├── useMessages.ts
│   ├── useFileUpload.ts
│   └── usePresence.ts
├── stores/
│   └── chat-store.ts
└── types/
    └── consultation.types.ts
```

### 데이터 플로우
```
사용자 입력
  ↓
MessageInput (컴포넌트)
  ↓
sendMessage (hook)
  ↓
message-manager (서비스)
  ↓
Supabase INSERT
  ↓
Realtime 브로드캐스트
  ↓
handleNewMessage (구독)
  ↓
React Query 캐시 업데이트
  ↓
MessageList 리렌더링
```

---

## 리스크 및 대응 방안

### 1. WebSocket 연결 불안정
**리스크**: 모바일 네트워크에서 연결 끊김 빈번
**대응**:
- 자동 재연결 로직 (exponential backoff)
- 재연결 후 메시지 동기화
- 연결 상태 UI 표시

### 2. 대용량 파일 업로드
**리스크**: 5MB 파일 업로드 시간 초과
**대응**:
- 파일 크기 제한 엄격히 검증 (≤5MB)
- 업로드 타임아웃 30초 설정
- 진행률 표시로 사용자 피드백

### 3. 메시지 순서 보장
**리스크**: 네트워크 지연으로 메시지 순서 뒤바뀜
**대응**:
- created_at 타임스탬프 기준 정렬
- 서버 시간 사용 (클라이언트 시간 무시)
- 낙관적 업데이트 후 서버 응답으로 재검증

### 4. XSS 공격
**리스크**: 악의적 사용자가 스크립트 포함 메시지 전송
**대응**:
- 메시지 렌더링 시 HTML 이스케이프
- DOMPurify 라이브러리 활용
- CSP (Content Security Policy) 헤더 설정

---

## 성능 최적화 전략

### 1. 메시지 페이징
- 초기 로딩: 최근 50개 메시지만
- 무한 스크롤: 스크롤 상단 도달 시 이전 50개 로드
- React Query `useInfiniteQuery` 활용

### 2. 이미지 최적화
- 썸네일 생성 (Supabase Image Transformation)
- Lazy Loading (Intersection Observer)
- WebP 포맷 우선 사용

### 3. 메모이제이션
- `React.memo`로 MessageItem 컴포넌트 최적화
- `useMemo`로 메시지 필터링/정렬 캐싱
- `useCallback`으로 이벤트 핸들러 메모이제이션

---

## 보안 체크리스트

- [ ] JWT 토큰 검증 (모든 API 호출)
- [ ] RLS 정책 설정 (매칭된 페어만 조회 가능)
- [ ] 파일 MIME 타입 검증 (서버 사이드)
- [ ] XSS 방지 (HTML 이스케이프)
- [ ] CSRF 토큰 (Supabase 기본 제공)
- [ ] Rate Limiting (메시지 전송 1초당 5회)
- [ ] 파일 URL 서명 검증 (Supabase Storage)

---

## 의존성 관리

### NPM 패키지
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "msw": "^2.0.11"
  }
}
```

### Supabase 테이블 의존성
- `consultations` 테이블 (match_id 참조)
- `users` 테이블 (sender_id 참조)
- `matches` 테이블 (MATCH-001에서 생성)

---

## 테스트 계획

### 단위 테스트 (Vitest)
- 메시지 검증 함수
- 파일 검증 함수
- 재전송 로직

### 통합 테스트 (MSW)
- Supabase Realtime 구독/발행 모킹
- 파일 업로드 모킹
- 에러 시나리오 (네트워크 오류, 타임아웃)

### E2E 테스트 (Playwright)
- 메시지 전송/수신 플로우
- 파일 첨부/다운로드
- 읽음 상태 변경

---

## 다음 단계

1. **데이터베이스 스키마 생성**: `consultations`, `messages` 테이블 마이그레이션
2. **TDD 구현**: `/alfred:2-build CONSULT-001` 실행
3. **통합 테스트**: Supabase Realtime 실제 연결 테스트
4. **문서 동기화**: `/alfred:3-sync` 실행

---

**문서 버전**: v0.0.1
**최종 수정일**: 2025-10-20
**작성자**: @Goos
