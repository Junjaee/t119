---
# 필수 필드 (7개)
id: ADMIN-001
version: 0.0.1
status: draft
created: 2025-10-21
updated: 2025-10-21
author: @Alfred
priority: medium

# 선택 필드 - 분류/메타
category: feature
labels:
  - admin
  - association-management
  - user-approval
  - monitoring

# 선택 필드 - 관계 (의존성 그래프)
depends_on:
  - AUTH-001
related_specs:
  - STATS-001

# 선택 필드 - 범위 (영향 분석)
scope:
  packages:
    - src/features/admin
  files:
    - admin-service.ts
    - association-manager.ts
    - user-approval.ts
---

# @SPEC:ADMIN-001: 관리자 협회 관리 시스템

## HISTORY

### v0.0.1 (2025-10-21)
- **INITIAL**: 관리자 협회 관리 시스템 명세 작성
- **AUTHOR**: @Alfred
- **REASON**: 협회 생성/수정/삭제, 사용자 승인, 플랫폼 모니터링 기능 제공

---

## 1. Overview

### 비즈니스 목표
교권 보호 협회 관리자가 협회를 생성/수정/삭제하고, 가입 신청 사용자를 승인하며, 플랫폼 전체를 모니터링할 수 있는 관리 시스템 제공

### 핵심 가치 제안
- **협회 관리**: 협회 CRUD (생성, 조회, 수정, 삭제)
- **사용자 승인**: 가입 신청 사용자 승인/거부 (24시간 내 처리 권장)
- **플랫폼 모니터링**: 실시간 통계, 부적절 활동 감지, 감사 로그
- **역할 관리**: 관리자, 일반 사용자 역할 구분

---

## 2. EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)
시스템은 다음 핵심 기능을 제공해야 한다:

- **UR-001**: 시스템은 협회 CRUD 기능을 제공해야 한다
  - 생성: 협회명, 지역, 설명, 로고 이미지
  - 조회: 전체 협회 목록, 상세 정보
  - 수정: 협회 정보 변경
  - 삭제: 소프트 삭제 (is_deleted=true)
- **UR-002**: 시스템은 사용자 승인/거부 기능을 제공해야 한다
  - 승인 대기 큐 조회
  - 승인/거부 처리 (사유 입력)
  - 승인 시 role='user' 설정
- **UR-003**: 시스템은 플랫폼 통계 모니터링 기능을 제공해야 한다
  - 일간/주간/월간 신고 건수
  - 사용자 가입 추이
  - 상담 완료율
- **UR-004**: 시스템은 사용자 역할 관리 기능을 제공해야 한다
  - 역할: admin (관리자), user (일반 사용자)
  - 권한: 관리자만 협회 생성/수정/삭제 가능

### Event-driven Requirements (이벤트 기반)
WHEN [조건]이면, 시스템은 다음과 같이 동작해야 한다:

- **ER-001**: WHEN 신규 협회가 생성되면, 시스템은 기본 설정을 초기화해야 한다
  - 기본 설정: 알림 ON, 공개 상태 (is_public=true)
  - 생성자를 협회 관리자로 자동 등록
- **ER-002**: WHEN 사용자가 가입 신청하면, 시스템은 관리자에게 알림을 전송해야 한다
  - 알림 채널: 이메일 + 실시간 알림
  - 본문: 사용자명, 가입 사유, 승인 링크
- **ER-003**: WHEN 부적절한 활동이 감지되면, 시스템은 관리자에게 경고를 전송해야 한다
  - 부적절 활동 예시: 스팸 게시글, 반복적인 신고, 비정상 로그인 시도
  - 알림 채널: 이메일 + 시스템 알림
- **ER-004**: WHEN 사용자 승인 처리 시, 시스템은 사용자에게 알림을 전송해야 한다
  - 승인: "가입이 승인되었습니다"
  - 거부: "가입이 거부되었습니다 (사유: ...)"

### State-driven Requirements (상태 기반)
WHILE [상태]일 때, 시스템은 다음과 같이 동작해야 한다:

- **SR-001**: WHILE 관리자가 로그인한 상태일 때, 시스템은 실시간 통계를 표시해야 한다
  - 갱신 주기: 5분 (React Query staleTime)
  - 표시 항목: 신고 건수, 상담 건수, 사용자 수
- **SR-002**: WHILE 승인 대기 중인 사용자가 있을 때, 시스템은 대기 큐 알림을 표시해야 한다
  - 알림 배지: 우상단 알림 센터
  - 대기 큐 개수 표시

### Optional Features (선택적 기능)
WHERE [조건]이면, 시스템은 다음 기능을 제공할 수 있다:

- **OF-001**: WHERE 사용자가 요청하면, 시스템은 감사 로그 내보내기 기능을 제공할 수 있다
  - 형식: CSV 또는 Excel
  - 필터: 날짜 범위, 이벤트 유형

### Constraints (제약사항)
시스템은 다음 제약을 준수해야 한다:

- **C-001**: 협회명은 2~50자 제한
  - 중복 불가 (unique constraint)
- **C-002**: 한 관리자는 최대 10개 협회 관리 가능
  - 10개 초과 시 생성 불가 (에러 메시지 표시)
- **C-003**: 사용자 승인은 24시간 이내 처리 권장
  - 24시간 초과 시 관리자에게 리마인더 알림
- **C-004**: 협회 삭제는 소프트 삭제 (is_deleted=true)
  - 완전 삭제는 관리자 승인 필요 (Phase 2)
- **C-005**: 관리자 권한 변경은 슈퍼 관리자만 가능
  - role='super_admin' 확인

---

## 3. 데이터 모델

### 3.1 associations (협회)
```typescript
interface Association {
  id: string;                  // UUID
  name: string;                // 협회명 (2~50자, unique)
  region: string;              // 지역 (17개 시도)
  description: string;         // 설명 (최대 500자)
  logo_url?: string;           // 로고 이미지 URL (optional)
  is_public: boolean;          // 공개 여부 (default: true)
  is_deleted: boolean;         // 삭제 여부 (default: false)
  created_by: string;          // 생성자 ID (FK: users.id)
  created_at: Date;
  updated_at: Date;
}
```

### 3.2 association_members (협회 회원)
```typescript
interface AssociationMember {
  id: string;                  // UUID
  association_id: string;      // 협회 ID (FK: associations.id)
  user_id: string;             // 사용자 ID (FK: users.id)
  role: 'admin' | 'member';    // 역할 (default: 'member')
  joined_at: Date;
}
```

### 3.3 user_approvals (사용자 승인)
```typescript
interface UserApproval {
  id: string;                  // UUID
  user_id: string;             // 신청자 ID (FK: users.id)
  association_id?: string;     // 가입 희망 협회 ID (optional)
  status: 'pending' | 'approved' | 'rejected';  // 상태 (default: 'pending')
  reason: string;              // 가입 사유 (1~200자)
  rejected_reason?: string;    // 거부 사유 (optional)
  approved_by?: string;        // 승인자 ID (FK: users.id, optional)
  created_at: Date;
  updated_at: Date;
}
```

### 3.4 audit_logs (감사 로그)
```typescript
interface AuditLog {
  id: string;                  // UUID
  user_id: string;             // 작업 수행자 ID (FK: users.id)
  action: string;              // 작업 유형 (예: 'association_created', 'user_approved')
  resource_type: string;       // 리소스 유형 (예: 'association', 'user')
  resource_id: string;         // 리소스 ID
  changes?: object;            // 변경 내용 (JSON)
  ip_address: string;          // IP 주소
  user_agent: string;          // User-Agent
  created_at: Date;
}
```

---

## 4. API 설계

### 4.1 협회 관리 API

#### POST /api/admin/associations
협회 생성 (관리자 전용)

**Request Body**:
```typescript
{
  name: string;        // 2~50자, unique
  region: string;      // 17개 시도
  description: string; // 최대 500자
  logo?: File;         // optional, max 2MB
}
```

**Response** (201 Created):
```typescript
{
  association: {
    id: string;
    name: string;
    region: string;
    description: string;
    logo_url?: string;
    is_public: true;
    created_at: string;
  }
}
```

#### GET /api/admin/associations
협회 목록 조회

**Query Parameters**:
```typescript
{
  page?: number;       // default: 1
  limit?: number;      // default: 20
  region?: string;     // optional: 지역 필터
  is_deleted?: boolean; // optional: 삭제된 협회 포함 여부
}
```

**Response** (200 OK):
```typescript
{
  associations: Association[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  }
}
```

#### PATCH /api/admin/associations/:id
협회 정보 수정 (관리자 전용)

**Request Body**:
```typescript
{
  name?: string;
  description?: string;
  is_public?: boolean;
}
```

**Response** (200 OK):
```typescript
{
  association: Association;
}
```

#### DELETE /api/admin/associations/:id
협회 삭제 (소프트 삭제)

**Response** (200 OK):
```typescript
{
  association: {
    id: string;
    is_deleted: true;
    updated_at: string;
  }
}
```

### 4.2 사용자 승인 API

#### GET /api/admin/approvals
승인 대기 큐 조회

**Query Parameters**:
```typescript
{
  status?: 'pending' | 'approved' | 'rejected';  // default: 'pending'
  page?: number;
  limit?: number;
}
```

**Response** (200 OK):
```typescript
{
  approvals: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    association?: {
      id: string;
      name: string;
    };
    reason: string;
    status: string;
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  }
}
```

#### POST /api/admin/approvals/:id/approve
사용자 승인

**Response** (200 OK):
```typescript
{
  approval: {
    id: string;
    status: 'approved';
    approved_by: string;
    updated_at: string;
  }
}
```

#### POST /api/admin/approvals/:id/reject
사용자 거부

**Request Body**:
```typescript
{
  reason: string;  // 거부 사유 (1~200자)
}
```

**Response** (200 OK):
```typescript
{
  approval: {
    id: string;
    status: 'rejected';
    rejected_reason: string;
    updated_at: string;
  }
}
```

### 4.3 플랫폼 모니터링 API

#### GET /api/admin/dashboard
관리자 대시보드 통계

**Response** (200 OK):
```typescript
{
  overview: {
    total_users: number;
    total_reports: number;
    total_consultations: number;
    pending_approvals: number;
  },
  recent_activities: Array<{
    action: string;
    user_name: string;
    created_at: string;
  }>,
  alerts: Array<{
    type: 'spam' | 'abnormal_login' | 'high_report_count';
    message: string;
    created_at: string;
  }>
}
```

#### GET /api/admin/audit-logs
감사 로그 조회

**Query Parameters**:
```typescript
{
  start_date?: string;  // ISO 8601
  end_date?: string;    // ISO 8601
  action?: string;      // optional: 작업 유형 필터
  page?: number;
  limit?: number;
}
```

**Response** (200 OK):
```typescript
{
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  }
}
```

### 4.4 감사 로그 내보내기 API (Optional)

#### POST /api/admin/audit-logs/export
감사 로그 CSV/Excel 내보내기

**Request Body**:
```typescript
{
  start_date: string;
  end_date: string;
  format: 'csv' | 'excel';
}
```

**Response** (200 OK):
```typescript
{
  file_url: string;      // Supabase Storage URL
  file_name: string;     // audit-logs-2025-10-21.csv
  expires_at: string;    // ISO 8601 (24시간 후 만료)
}
```

---

## 5. 성능 요구사항

### 5.1 응답 시간
- **P-001**: 협회 목록 조회 API는 300ms 이내 응답해야 한다
- **P-002**: 승인 대기 큐 조회 API는 200ms 이내 응답해야 한다
- **P-003**: 대시보드 통계 API는 500ms 이내 응답해야 한다

### 5.2 처리량
- **P-004**: 시스템은 동시 접속 관리자 50명을 지원해야 한다
- **P-005**: 시스템은 초당 20개 승인 요청을 처리해야 한다

### 5.3 확장성
- **P-006**: 협회 개수는 10,000개까지 지원해야 한다
  - 페이지네이션 필수
- **P-007**: 감사 로그는 100만 건 이상 저장 가능해야 한다
  - 인덱스 최적화: `CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC)`

---

## 6. 보안 요구사항

### 6.1 인증/인가
- **S-001**: 모든 관리자 API는 JWT 인증을 요구해야 한다
- **S-002**: 관리자 권한 확인 (role='admin' 또는 'super_admin')
  - Row Level Security (RLS): `auth.jwt() ->> 'role' = 'admin'`
- **S-003**: 협회 수정/삭제는 생성자 본인 또는 슈퍼 관리자만 가능해야 한다

### 6.2 데이터 검증
- **S-004**: 협회명은 XSS 공격 방지를 위해 HTML 태그를 이스케이프해야 한다
- **S-005**: 로고 이미지는 파일 확장자 및 MIME 타입을 검증해야 한다
  - 허용 확장자: .png, .jpg, .jpeg, .gif
  - 최대 크기: 2MB
- **S-006**: SQL Injection 방지 (Prepared Statement 사용)

### 6.3 감사 로그
- **S-007**: 모든 관리자 작업은 감사 로그에 기록되어야 한다
  - 기록 항목: 작업 유형, 리소스 ID, 변경 내용, IP 주소, User-Agent
- **S-008**: 감사 로그는 읽기 전용 (수정/삭제 불가)
  - RLS: `auth.jwt() ->> 'role' = 'super_admin'` (읽기만 허용)

---

## 7. 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5.6.3** (strict mode)
- **React Query 5.56.0** (데이터 페칭)
- **Tailwind CSS** (스타일링)

### Backend
- **Supabase** (PostgreSQL + Auth)
- **Supabase Storage** (로고 이미지 저장)
- **Supabase Functions** (감사 로그 서버리스)

### Testing
- **Vitest** (단위 테스트)
- **React Testing Library** (컴포넌트 테스트)
- **Playwright** (E2E 테스트)

---

## 8. 구현 우선순위

### 1차 목표 (Core Admin Features)
- [ ] 협회 CRUD API 구현
- [ ] 협회 관리 UI (목록, 생성, 수정, 삭제)
- [ ] 사용자 승인/거부 API 구현
- [ ] 승인 대기 큐 UI

### 2차 목표 (Monitoring)
- [ ] 플랫폼 모니터링 대시보드
- [ ] 실시간 통계 (React Query 캐싱)
- [ ] 부적절 활동 감지 로직
- [ ] 관리자 알림 시스템

### 3차 목표 (Audit Logs)
- [ ] 감사 로그 기록 (모든 관리자 작업)
- [ ] 감사 로그 조회 UI (필터링, 페이지네이션)
- [ ] 감사 로그 내보내기 (CSV/Excel)

### 4차 목표 (Optional Features)
- [ ] 역할 관리 (관리자 → 일반 사용자 전환)
- [ ] 협회 통계 (회원 수, 활동 지표)
- [ ] 대량 사용자 승인 기능

---

## 9. 테스트 계획

### 9.1 단위 테스트
- **협회명 중복 검증 로직**
- **관리자 권한 확인 로직** (role='admin' 검증)
- **감사 로그 기록 함수**

### 9.2 통합 테스트
- **협회 생성 → 기본 설정 초기화 플로우**
- **사용자 승인 → 알림 전송 플로우**
- **부적절 활동 감지 → 관리자 경고 플로우**

### 9.3 E2E 테스트
- **사용자 시나리오**: 협회 생성 → 사용자 승인 → 감사 로그 확인
- **권한 검증**: 일반 사용자 → 관리자 페이지 접근 차단
- **성능 테스트**: 10,000개 협회 목록 조회 속도

---

## 10. Traceability (추적성)

### TAG 체계
- `@SPEC:ADMIN-001` - 본 명세 문서
- `@TEST:ADMIN-001` - 테스트 코드 (tests/admin/)
- `@CODE:ADMIN-001` - 구현 코드 (src/features/admin/)
- `@DOC:ADMIN-001` - Living Document (docs/admin.md)

### 의존성
- **depends_on**: AUTH-001 (사용자 인증 및 역할 관리)
- **related_specs**: STATS-001 (통계 대시보드와 데이터 공유)

---

**최종 업데이트**: 2025-10-21
**작성자**: @Alfred
**버전**: 0.0.1 (INITIAL)
