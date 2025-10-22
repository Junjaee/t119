---
# 필수 필드 (7개)
id: NOTIFICATION-001
version: 0.1.0
status: completed
created: 2025-10-21
updated: 2025-10-22
author: @Alfred
priority: medium

# 선택 필드 - 분류/메타
category: feature
labels:
  - notification
  - email
  - realtime
  - communication

# 선택 필드 - 관계 (의존성 그래프)
depends_on:
  - AUTH-001
  - CONSULT-001
blocks:
  - COMMUNITY-001

# 선택 필드 - 범위 (영향 분석)
scope:
  packages:
    - src/features/notifications
    - src/lib/email
  files:
    - notification-service.ts
    - email-sender.ts
    - realtime-notifier.ts
---

# @SPEC:NOTIFICATION-001: 다채널 알림 시스템

## HISTORY

### v0.1.0 (2025-10-22)
- **CHANGED**: TDD 구현 완료 (코어 서비스 및 API 레이어)
- **AUTHOR**: @Alfred
- **REASON**: 이메일/실시간 알림 핵심 기능 구현 완료
- **REVIEW**: Autonomous TDD Implementation (13 TAGs, 10 완료)

### v0.0.1 (2025-10-21)
- **INITIAL**: 이메일/실시간 다채널 알림 시스템 명세 작성
- **AUTHOR**: @Alfred
- **REASON**: 사건 진행 상황, 상담 메시지, 시스템 알림 실시간 전달을 통한 사용자 재방문율 증가 및 24시간 내 변호사 배정 보장

---

## 1. Overview

### 비즈니스 목표
사건 진행 상황, 상담 메시지, 시스템 알림을 다채널(이메일, 실시간, SMS)로 전달하여 사용자 재방문율을 증가시키고, 긴급 상황에 즉시 대응하여 24시간 내 변호사 배정을 보장

### 핵심 가치 제안
- **다채널 알림**: 이메일 + 실시간 브라우저 알림 + SMS(긴급 시)
- **실시간 전달**: WebSocket 기반 즉시 알림 (≤2초)
- **알림 설정 관리**: 사용자 맞춤형 알림 ON/OFF
- **알림 이력 조회**: 최근 30일 알림 이력 보관

---

## 2. EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)
시스템은 다음 핵심 기능을 제공해야 한다:

- **UR-001**: 시스템은 이메일 알림 기능을 제공해야 한다
  - 라이브러리: Resend API
  - 템플릿: React Email (구조화된 HTML 이메일)
- **UR-002**: 시스템은 실시간 브라우저 알림을 제공해야 한다
  - 기술: Supabase Realtime (WebSocket)
  - 표시 위치: 우상단 알림 센터 + 토스트
- **UR-003**: 시스템은 알림 설정 관리 기능을 제공해야 한다
  - 설정 항목: 이메일, 브라우저 알림, SMS 수신 동의
  - 카테고리별 알림 ON/OFF
- **UR-004**: 시스템은 알림 이력 조회 기능을 제공해야 한다
  - 보관 기간: 30일
  - 필터: 읽음/안읽음, 카테고리별

### Event-driven Requirements (이벤트 기반)
WHEN [조건]이면, 시스템은 다음과 같이 동작해야 한다:

- **ER-001**: WHEN 변호사가 배정되면, 시스템은 교사에게 이메일을 전송해야 한다
  - 제목: "[T119] 변호사가 배정되었습니다"
  - 본문: 변호사명, 연락처, 상담 일정 안내
  - 발송 지연: ≤5초
- **ER-002**: WHEN 신규 메시지가 도착하면, 시스템은 실시간 알림을 표시해야 한다
  - 알림 표시: 우상단 알림 센터 배지 + 토스트
  - 전달 지연: ≤2초
- **ER-003**: WHEN 사건 상태가 변경되면, 시스템은 관련자에게 알림을 전송해야 한다
  - 채널: 이메일 + 실시간 알림
  - 상태 변경 예시: 접수 완료, 상담 중, 해결 완료
- **ER-004**: WHEN 상담 시작 1시간 전이면, 시스템은 리마인더 알림을 전송해야 한다
  - 채널: 이메일 + 실시간 알림
  - 본문: 상담 일시, 장소, 준비 사항

### State-driven Requirements (상태 기반)
WHILE [상태]일 때, 시스템은 다음과 같이 동작해야 한다:

- **SR-001**: WHILE 사용자가 오프라인 상태일 때, 시스템은 알림을 저장하고 재접속 시 표시해야 한다
  - 저장 위치: notifications 테이블 (is_read=false)
  - 재접속 시 자동 표시
- **SR-002**: WHILE 알림 전송 중일 때, 시스템은 재전송 로직을 실행해야 한다 (최대 3회)
  - 재전송 간격: 1초, 3초, 10초 (exponential backoff)
  - 3회 실패 시 관리자에게 에러 로그 전송

### Optional Features (선택적 기능)
WHERE [조건]이면, 시스템은 다음 기능을 제공할 수 있다:

- **OF-001**: WHERE 사용자가 SMS 수신을 동의하면, 시스템은 긴급 알림을 SMS로 전송할 수 있다
  - 라이브러리: Twilio API (Phase 2)
  - 긴급 알림 예시: 변호사 긴급 연락, 법원 출석 리마인더
- **OF-002**: WHERE 사용자가 요청하면, 시스템은 알림 요약 이메일을 제공할 수 있다
  - 주기: 일간 또는 주간 (사용자 설정)
  - 내용: 읽지 않은 알림 목록, 중요 알림 강조

### Constraints (제약사항)
시스템은 다음 제약을 준수해야 한다:

- **C-001**: 이메일 발송은 5초 이내 완료되어야 한다
  - Resend API 타임아웃: 5초
  - 실패 시 재시도 3회
- **C-002**: 실시간 알림은 WebSocket 연결이 끊어진 경우 30초 내 재연결해야 한다
  - 재연결 로직: exponential backoff (1초, 5초, 15초, 30초)
  - 30초 내 재연결 실패 시 polling 모드 전환
- **C-003**: SMS 발송은 긴급 알림만 허용 (비용 고려)
  - 긴급 알림 기준: 변호사 긴급 연락, 법원 출석 D-1 리마인더
  - SMS 발송 한도: 월 100건 (초과 시 관리자 승인 필요)
- **C-004**: 알림 재전송 횟수는 3회를 초과하지 않아야 한다
  - 3회 실패 시 에러 로그 저장 + 관리자 알림
- **C-005**: 알림 이력은 30일간 보관
  - 30일 초과 시 자동 삭제 (Supabase scheduled function)

---

## 3. 데이터 모델

### 3.1 notifications (알림)
```typescript
interface Notification {
  id: string;                  // UUID
  user_id: string;             // 수신자 ID (FK: users.id)
  type: 'email' | 'realtime' | 'sms';  // 알림 채널
  category: 'counselor_assigned' | 'new_message' | 'status_changed' | 'reminder';
  title: string;               // 제목 (최대 100자)
  content: string;             // 본문 (최대 500자)
  link_url?: string;           // 관련 페이지 URL (optional)
  is_read: boolean;            // 읽음 여부 (default: false)
  sent_at?: Date;              // 전송 완료 시간
  failed_count: number;        // 실패 횟수 (default: 0, max: 3)
  created_at: Date;
  updated_at: Date;
}
```

### 3.2 notification_settings (알림 설정)
```typescript
interface NotificationSettings {
  id: string;                  // UUID
  user_id: string;             // 사용자 ID (FK: users.id, unique)
  email_enabled: boolean;      // 이메일 알림 ON/OFF (default: true)
  realtime_enabled: boolean;   // 실시간 알림 ON/OFF (default: true)
  sms_enabled: boolean;        // SMS 알림 ON/OFF (default: false)
  counselor_assigned: boolean; // 변호사 배정 알림 (default: true)
  new_message: boolean;        // 신규 메시지 알림 (default: true)
  status_changed: boolean;     // 상태 변경 알림 (default: true)
  reminder: boolean;           // 리마인더 알림 (default: true)
  created_at: Date;
  updated_at: Date;
}
```

### 3.3 email_templates (이메일 템플릿)
```typescript
interface EmailTemplate {
  id: string;                  // UUID
  template_key: 'counselor_assigned' | 'new_message' | 'status_changed' | 'reminder';
  subject: string;             // 제목 (템플릿 변수 포함)
  html_content: string;        // HTML 본문 (React Email)
  plain_text: string;          // 플레인 텍스트 (fallback)
  variables: string[];         // 템플릿 변수 목록 (예: ['{counselor_name}', '{scheduled_at}'])
  created_at: Date;
  updated_at: Date;
}
```

---

## 4. API 설계

### 4.1 알림 조회 API

#### GET /api/notifications
알림 목록 조회

**Query Parameters**:
```typescript
{
  page?: number;          // default: 1
  limit?: number;         // default: 20, max: 100
  is_read?: boolean;      // optional: true|false
  category?: string;      // optional: 필터링
}
```

**Response** (200 OK):
```typescript
{
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  },
  unread_count: number;   // 읽지 않은 알림 개수
}
```

#### PATCH /api/notifications/:id/read
알림 읽음 처리

**Response** (200 OK):
```typescript
{
  notification: {
    id: string;
    is_read: true;
    updated_at: string;
  }
}
```

### 4.2 알림 설정 API

#### GET /api/notifications/settings
사용자 알림 설정 조회

**Response** (200 OK):
```typescript
{
  settings: NotificationSettings;
}
```

#### PATCH /api/notifications/settings
알림 설정 업데이트

**Request Body**:
```typescript
{
  email_enabled?: boolean;
  realtime_enabled?: boolean;
  sms_enabled?: boolean;
  counselor_assigned?: boolean;
  new_message?: boolean;
  status_changed?: boolean;
  reminder?: boolean;
}
```

**Response** (200 OK):
```typescript
{
  settings: NotificationSettings;
}
```

### 4.3 알림 전송 API (내부 서비스)

#### POST /api/internal/notifications/send
알림 전송 (서버 내부 호출)

**Request Body**:
```typescript
{
  user_id: string;
  category: 'counselor_assigned' | 'new_message' | 'status_changed' | 'reminder';
  title: string;
  content: string;
  link_url?: string;
  channels: ('email' | 'realtime' | 'sms')[];  // 전송 채널 배열
}
```

**Response** (201 Created):
```typescript
{
  notifications: Array<{
    id: string;
    type: 'email' | 'realtime' | 'sms';
    status: 'sent' | 'failed';
    sent_at?: string;
  }>
}
```

---

## 5. 이메일 템플릿 (React Email)

### 5.1 변호사 배정 알림 템플릿
```tsx
// @CODE:NOTIFICATION-001:EMAIL
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

interface CounselorAssignedEmailProps {
  counselor_name: string;
  counselor_phone: string;
  scheduled_at: string;
  consultation_link: string;
}

export default function CounselorAssignedEmail({
  counselor_name,
  counselor_phone,
  scheduled_at,
  consultation_link,
}: CounselorAssignedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            변호사가 배정되었습니다
          </Text>
          <Text style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            안녕하세요. T119입니다.<br />
            귀하의 상담을 담당할 변호사가 배정되었습니다.
          </Text>
          <Text style={{ fontSize: '14px', marginBottom: '10px' }}>
            <strong>변호사명:</strong> {counselor_name}
          </Text>
          <Text style={{ fontSize: '14px', marginBottom: '10px' }}>
            <strong>연락처:</strong> {counselor_phone}
          </Text>
          <Text style={{ fontSize: '14px', marginBottom: '20px' }}>
            <strong>상담 일시:</strong> {scheduled_at}
          </Text>
          <Button
            href={consultation_link}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            상담 상세보기
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### 5.2 신규 메시지 알림 템플릿
```tsx
// @CODE:NOTIFICATION-001:EMAIL
export default function NewMessageEmail({
  sender_name,
  message_preview,
  message_link,
}: {
  sender_name: string;
  message_preview: string;
  message_link: string;
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            새로운 메시지가 도착했습니다
          </Text>
          <Text style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
            {sender_name}님으로부터 메시지가 도착했습니다.
          </Text>
          <Text style={{ fontSize: '14px', backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
            {message_preview}
          </Text>
          <Button
            href={message_link}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            메시지 확인하기
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## 6. Realtime 알림 구현 (Supabase Realtime)

### 6.1 실시간 구독 (클라이언트)
```typescript
// @CODE:NOTIFICATION-001:REALTIME
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useRealtimeNotifications(userId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          // 토스트 알림 표시
          showToast(notification.title, notification.content);
          // React Query 캐시 무효화
          queryClient.invalidateQueries(['notifications', userId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
```

### 6.2 WebSocket 재연결 로직
```typescript
// @CODE:NOTIFICATION-001:REALTIME
const channel = supabase
  .channel(`notifications:${userId}`, {
    config: {
      reconnect: true,
      reconnectInterval: [1000, 5000, 15000, 30000],  // exponential backoff
    },
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('WebSocket 연결 성공');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('WebSocket 연결 실패 - polling 모드로 전환');
      // Fallback: polling 모드
      startPolling(userId);
    }
  });
```

---

## 7. 성능 요구사항

### 7.1 응답 시간
- **P-001**: 이메일 전송 API는 5초 이내 완료해야 한다
  - Resend API 평균 응답 시간: 2~3초
  - 재시도 로직 포함 최대 5초
- **P-002**: 실시간 알림 전달은 2초 이내 완료해야 한다
  - WebSocket 푸시 지연: ≤1초
  - 클라이언트 렌더링 지연: ≤1초

### 7.2 처리량
- **P-003**: 시스템은 초당 100개 알림 전송을 처리해야 한다
  - 이메일: Resend API 처리량 (분당 300개)
  - 실시간: Supabase Realtime 처리량 (초당 1000개)

### 7.3 가용성
- **P-004**: 알림 시스템은 99.9% 가용성을 보장해야 한다
  - WebSocket 재연결 로직 (30초 이내)
  - Fallback: polling 모드 (30초 간격)

---

## 8. 보안 요구사항

### 8.1 인증/인가
- **S-001**: 모든 알림 API는 JWT 인증을 요구해야 한다
- **S-002**: 알림 조회는 본인의 알림만 접근 가능해야 한다
  - Row Level Security (RLS) 적용: `user_id = auth.uid()`
- **S-003**: 알림 설정 변경은 본인만 가능해야 한다

### 8.2 데이터 검증
- **S-004**: 이메일 주소는 유효성 검증 후 전송해야 한다
  - 정규식: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **S-005**: SMS 수신 동의 여부를 확인해야 한다
  - `notification_settings.sms_enabled = true` 확인
- **S-006**: XSS 공격 방지 (알림 내용 이스케이프)
  - HTML 태그 제거: DOMPurify 사용

### 8.3 Rate Limiting
- **S-007**: 이메일 전송은 사용자당 1분에 5회 제한
  - Redis 기반 rate limiting
- **S-008**: SMS 전송은 사용자당 월 100회 제한
  - 초과 시 관리자 승인 필요

---

## 9. 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5.6.3** (strict mode)
- **React Query 5.56.0** (알림 데이터 페칭)
- **Supabase Realtime** (WebSocket)

### Backend
- **Resend API** (이메일 전송) - structure.md Line 218~224
  - 라이브러리: `resend@latest`
  - React Email: HTML 이메일 템플릿
- **Supabase Functions** (알림 전송 서버리스)
- **Twilio API** (SMS 전송, Phase 2)

### Testing
- **Vitest** (단위 테스트)
- **React Testing Library** (컴포넌트 테스트)
- **Playwright** (E2E 테스트)

---

## 10. 구현 우선순위

### 1차 목표 (Core Notification)
- [ ] 이메일 알림 전송 (Resend API)
- [ ] 실시간 브라우저 알림 (Supabase Realtime)
- [ ] 알림 목록 조회 API
- [ ] 알림 읽음 처리 API

### 2차 목표 (Settings & Templates)
- [ ] 알림 설정 관리 UI
- [ ] React Email 템플릿 (변호사 배정, 신규 메시지)
- [ ] WebSocket 재연결 로직
- [ ] 알림 이력 필터링 (읽음/안읽음, 카테고리)

### 3차 목표 (Advanced Features)
- [ ] 리마인더 알림 (상담 1시간 전)
- [ ] 알림 재전송 로직 (exponential backoff)
- [ ] 관리자 에러 로그 알림
- [ ] 알림 요약 이메일 (일간/주간)

### 4차 목표 (Optional Features)
- [ ] SMS 알림 (Twilio API)
- [ ] 사용자 정의 알림 주기 설정
- [ ] 알림 통계 (읽음률, 클릭률)

---

## 11. 테스트 계획

### 11.1 단위 테스트
- **이메일 전송 로직** (Resend API 모킹)
- **알림 재전송 로직** (exponential backoff 검증)
- **WebSocket 재연결 로직** (재연결 간격 검증)

### 11.2 통합 테스트
- **변호사 배정 → 이메일 전송 플로우**
- **신규 메시지 → 실시간 알림 표시 플로우**
- **알림 설정 변경 → 알림 차단 플로우**

### 11.3 E2E 테스트
- **사용자 시나리오**: 변호사 배정 → 이메일 수신 → 실시간 알림 확인
- **WebSocket 재연결**: 네트워크 끊김 → 30초 내 재연결
- **알림 이력 조회**: 읽음/안읽음 필터링

---

## 12. Traceability (추적성)

### TAG 체계
- `@SPEC:NOTIFICATION-001` - 본 명세 문서
- `@TEST:NOTIFICATION-001` - 테스트 코드 (tests/notifications/)
- `@CODE:NOTIFICATION-001` - 구현 코드 (src/features/notifications/)
- `@DOC:NOTIFICATION-001` - Living Document (docs/notifications.md)

### 의존성
- **depends_on**: AUTH-001 (사용자 인증), CONSULT-001 (상담 데이터)
- **blocks**: COMMUNITY-001 (커뮤니티 알림 기능 의존)

---

**최종 업데이트**: 2025-10-21
**작성자**: @Alfred
**버전**: 0.0.1 (INITIAL)
