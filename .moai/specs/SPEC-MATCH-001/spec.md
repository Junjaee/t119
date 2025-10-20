---
id: MATCH-001
version: 0.1.0
status: completed
created: 2025-10-20
updated: 2025-10-20
author: @Alfred
priority: high
category: feature
labels:
  - matching
  - consultation
  - lawyer
depends_on:
  - AUTH-001
  - REPORT-001
  - INFRA-001
scope:
  packages:
    - src/app/api/lawyers
    - src/app/api/consultations
    - src/lib/services
  files:
    - matching-service.ts
    - available-reports/route.ts
    - consultations/route.ts
---

# @SPEC:MATCH-001: 변호사 주도 매칭 시스템

## HISTORY

### v0.1.0 (2025-10-20)
- **CHANGED**: TDD 구현 완료 (RED-GREEN-REFACTOR)
- **ADDED**: 타입 정의 (`src/lib/types/matching.ts`)
- **ADDED**: 매칭 서비스 레이어 (`src/lib/services/matching-service.ts`)
- **ADDED**: 미배정 신고 조회 API (`src/app/api/lawyers/available-reports/route.ts`)
- **ADDED**: 상담 시작 API (`src/app/api/consultations/route.ts`)
- **ADDED**: 서비스 레이어 테스트 (10개 테스트, 100% 통과)
- **ADDED**: API 엔드포인트 테스트 (14개 테스트, 100% 통과)
- **AUTHOR**: @Alfred
- **REVIEW**: N/A (Personal 모드)

### v0.0.1 (2025-10-20)
- **INITIAL**: 변호사 주도 매칭 시스템 SPEC 작성
- **AUTHOR**: @Alfred

---

## 1. 개요 (Overview)

### 1.1 목적 (Purpose)

변호사가 미배정 신고 목록을 조회하고, 자신의 전문 분야 및 가용 시간에 맞춰 직접 신고를 선택하여 상담을 시작할 수 있는 시스템을 제공한다.

### 1.2 배경 (Background)

기존 자동 매칭 알고리즘과 교사의 수동 선택 기능을 제거하고, 변호사가 주도권을 가지고 사건을 선택하는 방식으로 전환한다. 이를 통해:
- 변호사의 전문성을 최대한 활용
- 가용 시간에 맞춰 자율적으로 업무량 조절
- 시스템 복잡도 감소 및 유지보수성 향상

### 1.3 범위 (Scope)

**포함 사항**:
- 변호사용 미배정 신고 목록 조회 API
- 변호사의 신고 상세 조회 API
- 변호사의 신고 선택 및 상담 시작 API
- 신고 상태 자동 전환 (submitted → assigned → in_progress)

**제외 사항**:
- ~~자동 매칭 알고리즘~~ (삭제)
- ~~교사의 수동 선택 기능~~ (삭제)
- ~~긴급 케이스 우선순위~~ (프로젝트 전체에서 삭제)
- ~~priority 필드~~ (사용하지 않음)

---

## 2. EARS 요구사항 (Requirements)

### 2.1 Ubiquitous Requirements (기본 요구사항)

#### MATCH-001-UR-01: 미배정 신고 목록 제공
시스템은 변호사 역할의 사용자에게 미배정 신고(`status=submitted`, `assigned_lawyer_id=NULL`) 목록을 제공해야 한다.

#### MATCH-001-UR-02: 신고 상세 조회 기능
시스템은 변호사가 신고의 상세 내용(제목, 설명, 카테고리, 발생일, 증거 파일 목록)을 조회할 수 있는 기능을 제공해야 한다.

#### MATCH-001-UR-03: 신고 선택 및 상담 시작
시스템은 변호사가 미배정 신고를 선택하여 상담을 시작할 수 있는 기능을 제공해야 한다.

---

### 2.2 Event-driven Requirements (이벤트 기반)

#### MATCH-001-ED-01: 신고 선택 시 상태 전환
WHEN 변호사가 미배정 신고를 선택하면, 시스템은 다음을 수행해야 한다:
- 신고 상태를 `submitted` → `assigned`로 변경
- `reports.assigned_lawyer_id`에 변호사 ID 할당
- `consultations` 테이블에 새 레코드 생성 (`status: pending`)

#### MATCH-001-ED-02: 첫 메시지 전송 시 진행 중 상태 전환
WHEN 변호사가 상담에서 첫 메시지를 전송하면, 시스템은 신고 상태를 `assigned` → `in_progress`로 변경해야 한다.

#### MATCH-001-ED-03: 중복 선택 방지
WHEN 변호사가 이미 다른 변호사에게 배정된 신고를 선택하려 하면, 시스템은 409 Conflict 에러를 반환해야 한다.

---

### 2.3 State-driven Requirements (상태 기반)

#### MATCH-001-SD-01: submitted 상태 신고 표시
WHILE 신고가 `submitted` 상태일 때, 시스템은 모든 변호사에게 미배정 신고 목록에 해당 신고를 표시해야 한다.

#### MATCH-001-SD-02: assigned 상태 접근 제어
WHILE 신고가 `assigned` 또는 `in_progress` 상태일 때, 시스템은 배정된 변호사만 상세 조회 및 메시지 송수신을 허용해야 한다.

#### MATCH-001-SD-03: 진행 중 상담 제한
WHILE 변호사가 진행 중인 상담(`status=in_progress`)이 10개 이상일 때, 시스템은 새로운 신고 선택을 제한할 수 있다.

---

### 2.4 Optional Features (선택적 기능)

#### MATCH-001-OF-01: 필터링 및 정렬
WHERE 변호사가 미배정 신고 목록을 조회할 때, 시스템은 다음 필터링 및 정렬 옵션을 제공할 수 있다:
- 카테고리별 필터링 (`category`)
- 발생일 기준 정렬 (`incident_date`)
- 생성일 기준 정렬 (`created_at`)

#### MATCH-001-OF-02: 통계 정보 제공
WHERE 변호사가 대시보드를 조회할 때, 시스템은 다음 통계를 제공할 수 있다:
- 현재 진행 중인 상담 수
- 완료한 상담 수
- 평균 만족도 점수

---

### 2.5 Constraints (제약사항)

#### MATCH-001-CN-01: 역할 기반 접근 제어
IF 사용자 역할이 `lawyer`가 아니면, 시스템은 변호사 전용 API 접근을 403 Forbidden으로 거부해야 한다.

#### MATCH-001-CN-02: 동시 선택 방지
IF 두 변호사가 동시에 같은 신고를 선택하려 하면, 시스템은 먼저 처리된 요청만 승인하고 나머지는 409 Conflict로 거부해야 한다.

#### MATCH-001-CN-03: 상담 수 제한
변호사는 동시에 최대 10개의 진행 중인 상담(`status=in_progress`)만 가질 수 있다.

#### MATCH-001-CN-04: 신고 상태 제약
신고 상태는 다음 순서로만 전환될 수 있다:
```
submitted → assigned → in_progress → resolved → closed
```

---

## 3. 데이터 모델 (Data Model)

### 3.1 기존 스키마 활용

본 SPEC은 기존 SPEC-INFRA-001의 데이터베이스 스키마를 그대로 활용한다.

#### 사용 테이블

**reports**:
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- title: VARCHAR(255)
- description: TEXT
- category: report_category ENUM
- incident_date: DATE
- status: report_status ENUM  -- submitted, assigned, in_progress, resolved, closed
- assigned_lawyer_id: UUID (FK → users, NULLABLE)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**consultations**:
```sql
- id: UUID (PK)
- report_id: UUID (FK → reports)
- teacher_id: UUID (FK → users)
- lawyer_id: UUID (FK → users)
- status: consultation_status ENUM  -- pending, active, completed, cancelled
- satisfaction_score: INTEGER (1-5, NULLABLE)
- feedback: TEXT (NULLABLE)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**users**:
```sql
- id: UUID (PK)
- email: VARCHAR(255)
- name: VARCHAR(100)
- role: user_role ENUM  -- teacher, lawyer, admin
- ...
```

### 3.2 상태 전환 규칙

#### report_status 전환
```
submitted (미배정)
    ↓ [변호사 선택: POST /api/consultations]
assigned (배정됨)
    ↓ [첫 메시지 전송: POST /api/messages]
in_progress (진행중)
    ↓ [변호사가 해결 표시: PATCH /api/reports/:id]
resolved (해결됨)
    ↓ [교사가 만족도 평가: PATCH /api/consultations/:id]
closed (종료)
```

#### consultation_status 전환
```
pending (대기)
    ↓ [첫 메시지 전송]
active (활성)
    ↓ [상담 완료]
completed (완료)
```

---

## 4. API 명세 (API Specification)

### 4.1 미배정 신고 목록 조회

**Endpoint**: `GET /api/lawyers/available-reports`

**인증**: Required (JWT, role: `lawyer`)

**Query Parameters**:
```typescript
{
  category?: 'parent' | 'student' | 'colleague' | 'other';
  sort?: 'created_at' | 'incident_date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

**Response** (200 OK):
```typescript
{
  reports: Array<{
    id: string;
    title: string;
    category: string;
    incident_date: string;
    created_at: string;
    teacher: {
      name: string;
      anonymous_nickname: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

**Error Responses**:
- `401 Unauthorized`: 인증 토큰 없음 또는 만료
- `403 Forbidden`: 변호사 역할이 아님

---

### 4.2 신고 상세 조회

**Endpoint**: `GET /api/reports/:id`

**인증**: Required (JWT, role: `lawyer`)

**Path Parameters**:
- `id` (UUID): 신고 ID

**Response** (200 OK):
```typescript
{
  id: string;
  title: string;
  description: string;
  category: string;
  incident_date: string;
  status: string;
  teacher: {
    name: string;
    anonymous_nickname: string;
  };
  evidence_files: Array<{
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
  }>;
  created_at: string;
}
```

**Error Responses**:
- `401 Unauthorized`: 인증 토큰 없음 또는 만료
- `403 Forbidden`: 변호사 역할이 아님 또는 배정된 변호사가 아님
- `404 Not Found`: 신고가 존재하지 않음

---

### 4.3 상담 시작 (신고 선택)

**Endpoint**: `POST /api/consultations`

**인증**: Required (JWT, role: `lawyer`)

**Request Body**:
```typescript
{
  report_id: string;  // UUID
}
```

**Response** (201 Created):
```typescript
{
  consultation: {
    id: string;
    report_id: string;
    teacher_id: string;
    lawyer_id: string;
    status: 'pending';
    created_at: string;
  };
  report: {
    id: string;
    status: 'assigned';
    assigned_lawyer_id: string;
  };
}
```

**Error Responses**:
- `401 Unauthorized`: 인증 토큰 없음 또는 만료
- `403 Forbidden`: 변호사 역할이 아님 또는 진행 중인 상담이 10개 이상
- `404 Not Found`: 신고가 존재하지 않음
- `409 Conflict`: 이미 다른 변호사에게 배정됨

**비즈니스 로직**:
1. 신고 상태 확인 (`status=submitted`, `assigned_lawyer_id=NULL`)
2. 변호사의 진행 중인 상담 수 확인 (≤ 10개)
3. 트랜잭션 시작:
   - `reports` 업데이트: `status='assigned'`, `assigned_lawyer_id={lawyer_id}`
   - `consultations` 생성: `status='pending'`
4. 트랜잭션 커밋
5. 교사에게 알림 전송 (선택사항)

---

## 5. 보안 고려사항 (Security Considerations)

### 5.1 인증 및 권한

- **JWT 토큰 검증**: 모든 API는 유효한 JWT 토큰 필수
- **역할 기반 접근 제어**: `role=lawyer`만 변호사 전용 API 접근 가능
- **Row Level Security**: Supabase RLS 정책으로 데이터베이스 레벨 접근 제어

### 5.2 동시성 제어

- **낙관적 잠금**: `updated_at` 필드로 버전 관리
- **트랜잭션**: 신고 선택 시 원자적 업데이트 보장
- **Unique Constraint**: 동일 신고에 대한 중복 상담 방지

### 5.3 데이터 보호

- **개인정보 마스킹**: 교사 이름 대신 익명 닉네임 사용 (선택)
- **증거 파일 접근 제어**: 배정된 변호사만 증거 파일 다운로드 가능
- **감사 로그**: 신고 선택, 상태 전환 이벤트 로깅

---

## 6. 성능 요구사항 (Performance Requirements)

### 6.1 응답 시간

- 미배정 신고 목록 조회: < 500ms (페이지당 20건)
- 신고 상세 조회: < 300ms
- 상담 시작 API: < 1000ms (트랜잭션 포함)

### 6.2 확장성

- 동시 접속 변호사: 최대 100명
- 초당 API 요청: 50 req/s
- 데이터베이스 쿼리 최적화: 인덱스 활용 (SPEC-INFRA-001 참조)

---

## 7. 테스트 계획 (Test Plan)

### 7.1 단위 테스트 (Unit Tests)

**파일**: `tests/api/lawyers/available-reports.test.ts`
- 미배정 신고 목록 조회 성공
- 카테고리 필터링 동작 확인
- 정렬 옵션 동작 확인
- 페이지네이션 동작 확인
- 변호사 역할 아닌 경우 403 에러

**파일**: `tests/api/consultations/create.test.ts`
- 상담 시작 성공 (신고 상태 전환 확인)
- 이미 배정된 신고 선택 시 409 에러
- 진행 중인 상담 10개 초과 시 403 에러
- 존재하지 않는 신고 선택 시 404 에러

**파일**: `tests/lib/services/matching-service.test.ts`
- `getAvailableReports()` 로직 검증
- `selectReport()` 트랜잭션 검증
- 동시성 제어 로직 검증

### 7.2 통합 테스트 (Integration Tests)

- E2E 시나리오: 변호사 로그인 → 목록 조회 → 신고 선택 → 메시지 전송
- 데이터베이스 상태 전환 검증
- Supabase RLS 정책 검증

### 7.3 커버리지 목표

- 목표: ≥ 85%
- 핵심 비즈니스 로직: 100%

---

## 8. 의존성 (Dependencies)

### 8.1 SPEC 의존성

- **SPEC-AUTH-001** (v0.1.0): JWT 인증, 역할 검증
- **SPEC-REPORT-001** (v0.1.0): 신고 시스템, 상태 관리
- **SPEC-INFRA-001** (v0.1.0): 데이터베이스 스키마, Supabase 설정

### 8.2 외부 라이브러리

- `@supabase/supabase-js`: 데이터베이스 클라이언트
- `jose`: JWT 토큰 검증
- `zod`: API 요청/응답 검증

---

## 9. 향후 확장 (Future Enhancements)

### 9.1 Phase 2 후보 기능

- **알림 시스템**: 변호사가 신고를 선택하면 교사에게 실시간 알림
- **변호사 프로필**: 전문 분야, 경력, 평균 만족도 표시
- **자동 재배정**: 변호사가 7일 이상 응답 없을 시 자동 재배정
- **통계 대시보드**: 변호사별 상담 통계, 성과 지표

### 9.2 제외 사항 재검토

- ~~자동 매칭 알고리즘~~: Phase 2에서도 도입하지 않음
- ~~긴급 케이스~~: 프로젝트 전체에서 영구 제거

---

## 10. 참고 문서 (References)

- `.moai/project/product.md`: 비즈니스 요구사항
- `.moai/project/structure.md`: 시스템 아키텍처
- `.moai/specs/SPEC-AUTH-001/spec.md`: 인증 시스템 명세
- `.moai/specs/SPEC-REPORT-001/spec.md`: 신고 시스템 명세
- `.moai/specs/SPEC-INFRA-001/spec.md`: 인프라 및 데이터베이스 명세

---

**문서 상태**: Draft (v0.0.1)
**작성일**: 2025-10-20
**작성자**: @Alfred
**다음 단계**: TDD 구현 (`/alfred:2-build MATCH-001`)
