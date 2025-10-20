---
id: REPORT-001
version: 0.1.0
status: completed
created: 2025-10-20
updated: 2025-10-20
author: @teacher119
priority: critical
category: feature
labels:
  - reports
  - file-upload
  - anonymization
  - pii-detection
depends_on:
  - AUTH-001
  - INFRA-001
blocks:
  - MATCH-001
scope:
  packages:
    - src/app/reports
    - src/lib/validators
    - src/lib/utils
  files:
    - report-form.tsx
    - report-service.ts
    - anonymization.ts
---

# @SPEC:REPORT-001: 교권 침해 신고 접수 시스템

## HISTORY

### v0.1.0 (2025-10-20)
- **COMPLETED**: TDD 구현 완료 (RED-GREEN-REFACTOR)
- **TEST**: 테스트 27개 통과 (validator 15개, pii-masking 12개)
- **CODE**: 구현 파일 7개 (@CODE:REPORT-001)
  - src/lib/reports/*.ts (3개: report-service, pii-masking, file-validator)
  - src/app/api/reports/*.ts (2개 엔드포인트)
  - src/types/report.types.ts
  - src/lib/validators/report.validator.ts
- **AUTHOR**: @Alfred

### v0.0.1 (2025-10-20)
- **INITIAL**: 교권 침해 신고 접수 시스템 SPEC 최초 작성
- **AUTHOR**: @teacher119
- **SECTIONS**: EARS 기반 요구사항 명세, 데이터 모델, 보안 요구사항
- **REASON**: 교사119 플랫폼 MVP 핵심 기능 구현

---

## 개요 (Overview)

교사119 플랫폼의 핵심 기능인 **교권 침해 신고 접수 시스템**을 구현한다. 교사는 안전하고 익명화된 환경에서 교권 침해 사건을 신고할 수 있으며, 증거 파일을 업로드하고, 실시간으로 진행 상태를 추적할 수 있다.

### 핵심 가치
- **안전성**: 개인정보 자동 마스킹 및 익명화 처리
- **신속성**: 24시간 내 변호사 배정 보장
- **추적성**: 신고 상태 실시간 업데이트 및 알림
- **증거 보전**: 안전한 파일 업로드 및 저장 (Supabase Storage)

---

## Environment (환경 및 가정사항)

### 기술 환경
- **Frontend**: Next.js 14 (App Router), TypeScript 5+, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Storage)
- **State**: Zustand (전역 상태 관리)
- **Validation**: Zod (스키마 검증)
- **File Upload**: Supabase Storage API

### 가정사항
1. AUTH-001 (사용자 인증 시스템)이 선행 구현되어 JWT 토큰 검증 가능
2. INFRA-001 (Supabase 설정)이 완료되어 데이터베이스 및 Storage 사용 가능
3. 사용자는 인증된 교사 역할(teacher)을 보유
4. Supabase Storage 버킷(`report-files`)이 생성되어 있음
5. 파일 업로드는 클라이언트 → Supabase Storage 직접 업로드 방식

---

## Requirements (기능 요구사항)

### Ubiquitous Requirements (기본 요구사항)
- 시스템은 교사가 교권 침해 신고를 작성할 수 있는 기능을 제공해야 한다
- 시스템은 신고 유형을 3가지 카테고리(학부모/학생/동료)로 분류해야 한다
- 시스템은 증거 파일 업로드 기능을 제공해야 한다 (최대 10MB × 5개)
- 시스템은 신고 상태를 추적할 수 있는 기능을 제공해야 한다
- 시스템은 긴급도 평가 기능을 제공해야 한다 (normal/high/critical)

### Event-driven Requirements (이벤트 기반)
- **WHEN** 교사가 신고를 제출하면, 시스템은 "submitted" 상태로 저장하고 변호사 풀에 공개해야 한다
- **WHEN** 증거 파일이 업로드되면, 시스템은 파일 크기(≤10MB)와 타입(이미지/PDF/문서)을 검증해야 한다
- **WHEN** 신고 내용에 개인정보(이름/전화번호/주소)가 포함되면, 시스템은 자동으로 마스킹 처리해야 한다
- **WHEN** 변호사가 신고를 수락하면, 시스템은 상태를 "assigned"로 변경하고 교사에게 알림을 전송해야 한다
- **WHEN** 신고 상태가 변경되면, 시스템은 변경 이력을 기록하고 관련 사용자에게 알림해야 한다

### State-driven Requirements (상태 기반)
- **WHILE** 신고가 "submitted" 상태일 때, 시스템은 변호사 풀에서 조회 가능하게 해야 한다
- **WHILE** 신고가 "assigned" 또는 "in_progress" 상태일 때, 시스템은 교사와 변호사만 접근 가능하게 해야 한다
- **WHILE** 신고가 진행 중일 때, 시스템은 상태 변경 이력을 기록해야 한다
- **WHILE** 파일 업로드 중일 때, 시스템은 진행률을 표시해야 한다

### Optional Features (선택적 기능)
- **WHERE** 신고가 "critical" 긴급도로 분류되면, 시스템은 관리자에게 즉시 알림을 전송할 수 있다
- **WHERE** 유사 사례가 존재하면, 시스템은 참고 사례를 추천할 수 있다

### Constraints (제약사항)
- **IF** 신고 내용에 개인정보가 포함되면, 시스템은 자동으로 마스킹 처리해야 한다
- **IF** 파일 크기가 10MB를 초과하면, 시스템은 업로드를 거부하고 오류 메시지를 표시해야 한다
- **IF** 파일 형식이 허용되지 않으면 (jpg/png/pdf/docx 외), 시스템은 업로드를 거부해야 한다
- **IF** 사용자가 교사 역할이 아니면, 시스템은 신고 작성 페이지 접근을 차단해야 한다
- 신고 내용(description)은 최대 5000자로 제한해야 한다
- 증거 파일은 최대 5개까지 업로드 가능해야 한다

---

## Specifications (상세 명세)

### 신고 유형 분류 (Report Categories)

#### 1. 학부모 관련 (Parent-related)
- 폭언/욕설 (Verbal Abuse)
- 무리한 요구 (Unreasonable Demands)
- 명예훼손 (Defamation)
- 물리적 위협 (Physical Threats)

#### 2. 학생 관련 (Student-related)
- 수업 방해 (Class Disruption)
- 반항/불복종 (Defiance/Disobedience)
- 폭언/폭행 (Verbal/Physical Abuse)
- 사이버 불링 (Cyberbullying)

#### 3. 동료/관리자 관련 (Colleague/Admin-related)
- 직장 내 괴롭힘 (Workplace Harassment)
- 부당한 업무 지시 (Unfair Work Orders)
- 차별/배제 (Discrimination/Exclusion)

### 신고 상태 관리 (Report Status Flow)

```typescript
export enum ReportStatus {
  SUBMITTED = 'submitted',       // 제출됨 (변호사 배정 대기)
  ASSIGNED = 'assigned',         // 변호사 배정 완료
  IN_PROGRESS = 'in_progress',   // 상담 진행 중
  RESOLVED = 'resolved',         // 해결됨 (종결 대기)
  CLOSED = 'closed',             // 완전 종결 (만족도 조사 완료)
}

export enum ReportPriority {
  NORMAL = 'normal',             // 일반
  HIGH = 'high',                 // 높음
  CRITICAL = 'critical',         // 긴급 (24시간 내 배정 필수)
}
```

**상태 전환 규칙**:
```
submitted → assigned → in_progress → resolved → closed
    ↓           ↓            ↓            ↓
  (24h 내)  (상담 시작)  (해결 완료)  (만족도 조사)
```

### 데이터 모델 (Database Schema)

#### Reports 테이블
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- 분류
  category TEXT NOT NULL CHECK(category IN ('parent', 'student', 'colleague')),
  sub_category TEXT NOT NULL,

  -- 기본 정보
  title TEXT NOT NULL,
  description TEXT NOT NULL CHECK(length(description) <= 5000),

  -- 사건 정보
  incident_date TIMESTAMP NOT NULL,
  incident_location TEXT,
  perpetrator_type TEXT,

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK(status IN ('submitted', 'assigned', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK(priority IN ('normal', 'high', 'critical')),

  -- 배정
  assigned_lawyer_id UUID REFERENCES users(id),
  assigned_at TIMESTAMP,

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,

  -- 인덱스
  CONSTRAINT valid_status_flow CHECK (
    (status = 'assigned' AND assigned_lawyer_id IS NOT NULL) OR
    (status != 'assigned')
  )
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_assigned_lawyer_id ON reports(assigned_lawyer_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

#### Report Files 테이블 (증거 파일)
```sql
CREATE TABLE report_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- 파일 정보
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK(file_size <= 10485760), -- 10MB
  storage_path TEXT NOT NULL, -- Supabase Storage 경로

  -- 메타데이터
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT max_files_per_report CHECK (
    (SELECT COUNT(*) FROM report_files WHERE report_id = report_files.report_id) <= 5
  )
);

CREATE INDEX idx_report_files_report_id ON report_files(report_id);
```

#### Report Status History 테이블 (상태 변경 이력)
```sql
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- 상태 변경
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),

  -- 변경 사유
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_status_history_report_id ON report_status_history(report_id);
```

### API 엔드포인트

#### 신고 CRUD
```typescript
// 신고 목록 조회 (본인 신고만)
GET /api/reports
Query: ?status=submitted&priority=high&page=1&limit=10
Response: { data: Report[], pagination: { total, page, limit } }

// 신고 상세 조회
GET /api/reports/[id]
Response: {
  report: Report,
  files: ReportFile[],
  statusHistory: StatusHistory[]
}

// 신고 작성
POST /api/reports
Body: {
  category: 'parent' | 'student' | 'colleague',
  sub_category: string,
  title: string,
  description: string,
  incident_date: string,
  incident_location?: string,
  perpetrator_type?: string,
  priority: 'normal' | 'high' | 'critical',
}
Response: { report: Report }

// 신고 수정 (submitted 상태에서만 가능)
PUT /api/reports/[id]
Body: Partial<Report>
Response: { report: Report }

// 신고 삭제 (submitted 상태에서만 가능)
DELETE /api/reports/[id]
Response: { success: true }
```

#### 파일 업로드
```typescript
// 파일 업로드 (Supabase Storage 직접 업로드)
POST /api/reports/[id]/files
Body: FormData (file: File)
Response: { file: ReportFile }

// 파일 삭제
DELETE /api/reports/[id]/files/[fileId]
Response: { success: true }

// 파일 다운로드 (Signed URL)
GET /api/reports/[id]/files/[fileId]/download
Response: { url: string, expiresIn: number }
```

### 개인정보 자동 마스킹 (PII Detection & Anonymization)

#### 마스킹 대상
1. **이름**: 2자 이상 한글 이름 → `홍*동`, `김**`
2. **전화번호**: `010-1234-5678` → `010-****-****`
3. **주소**: 상세 주소 → `서울시 강남구 ***`
4. **이메일**: `test@example.com` → `t***@example.com`
5. **주민등록번호**: `123456-1234567` → `******-*******`

#### 구현 방법
```typescript
// src/lib/utils/anonymization.ts
export function maskPII(text: string): string {
  // 전화번호 마스킹
  text = text.replace(/01\d-\d{3,4}-\d{4}/g, (match) => {
    const parts = match.split('-');
    return `${parts[0]}-****-****`;
  });

  // 이름 마스킹 (2-4자 한글)
  text = text.replace(/([가-힣]){2,4}/g, (match) => {
    if (match.length === 2) return match[0] + '*';
    if (match.length === 3) return match[0] + '*' + match[2];
    return match[0] + '**' + match[3];
  });

  // 이메일 마스킹
  text = text.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
    (match, user, domain) => {
      return user[0] + '***@' + domain;
    }
  );

  return text;
}
```

### 파일 업로드 검증

#### 허용 파일 형식
- **이미지**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **문서**: `.pdf`, `.doc`, `.docx`, `.hwp`
- **기타**: `.txt`, `.zip`

#### 검증 규칙
```typescript
// src/lib/validators/file-validator.ts
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/haansoft-hwp',
  'text/plain',
  'application/zip',
];

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' };
  }

  return { valid: true };
}
```

---

## Security Requirements (보안 요구사항)

### 접근 제어 (Access Control)
1. **교사**: 본인이 작성한 신고만 조회/수정/삭제 가능
2. **변호사**: 배정된 신고만 조회 가능 (미배정 신고는 마스킹된 형태로만 조회)
3. **관리자**: 모든 신고 조회/수정 가능

### 데이터 보호
1. **암호화**: Supabase Storage는 자동 암호화 (AES-256)
2. **개인정보 마스킹**: 신고 내용 저장 전 자동 마스킹 처리
3. **파일 접근**: Signed URL (1시간 유효)로만 다운로드 가능
4. **감사 로그**: 모든 상태 변경 및 파일 업로드 이력 기록

### 보안 체크리스트
- [ ] JWT 토큰 검증 (AUTH-001 의존)
- [ ] 역할 기반 접근 제어 (RBAC)
- [ ] 파일 크기/형식 검증
- [ ] 개인정보 자동 마스킹
- [ ] SQL Injection 방지 (Supabase Prepared Statements)
- [ ] XSS 방지 (입력값 이스케이핑)
- [ ] CSRF 방지 (Next.js 기본 제공)

---

## Performance Requirements (성능 요구사항)

### 응답 시간
- 신고 목록 조회: < 500ms
- 신고 상세 조회: < 1초
- 신고 작성/수정: < 2초
- 파일 업로드: < 10초 (10MB 기준)

### 동시성
- 동시 사용자: 1,000명
- 동시 파일 업로드: 100개

### 확장성
- 월간 신고 건수: 10,000건
- 연간 파일 저장: 500GB

---

## Testing Requirements (테스트 요구사항)

### Unit Tests (단위 테스트)
- [ ] PII 마스킹 함수 테스트
- [ ] 파일 검증 함수 테스트
- [ ] 상태 전환 로직 테스트

### Integration Tests (통합 테스트)
- [ ] 신고 CRUD API 테스트
- [ ] 파일 업로드/다운로드 테스트
- [ ] 권한 검증 테스트

### E2E Tests (종단 간 테스트)
- [ ] 신고 작성 → 제출 → 배정 → 종결 전체 플로우
- [ ] 파일 업로드 → 다운로드 플로우

---

## Traceability (추적성)

### TAG 체인
```
@SPEC:REPORT-001 → @TEST:REPORT-001 → @CODE:REPORT-001 → @DOC:REPORT-001
```

### 의존성
- **의존**: AUTH-001 (사용자 인증), INFRA-001 (Supabase 설정)
- **차단**: MATCH-001 (변호사 매칭 시스템)

### 관련 문서
- PRD: `T119_prd.md` § 2.2 교권 침해 신고 시스템
- Product: `.moai/project/product.md` § @SPEC:PROBLEM-001
- DB Schema: PRD § 3.2 데이터베이스 스키마

---

**작성자**: @teacher119
**최종 수정**: 2025-10-20
**다음 단계**: `/alfred:2-build REPORT-001` 실행하여 TDD 구현 시작
