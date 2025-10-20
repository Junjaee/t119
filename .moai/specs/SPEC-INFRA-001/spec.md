---
id: INFRA-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @teacher119
priority: critical
category: feature
labels:
  - infrastructure
  - supabase
  - database
  - security
blocks:
  - AUTH-001
  - REPORT-001
scope:
  packages:
    - src/lib/supabase
    - supabase/migrations
  files:
    - client.ts
    - server.ts
    - admin.ts
---

# @SPEC:INFRA-001: Supabase 통합 설정

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: Supabase 통합 설정 명세 작성
- **AUTHOR**: @teacher119
- **REASON**: 교사119 플랫폼 데이터베이스 및 백엔드 인프라 구축

---

## 개요

교사119 플랫폼의 핵심 백엔드 인프라인 Supabase를 통합 설정합니다. PostgreSQL 데이터베이스, 인증 시스템, 스토리지, 실시간 기능을 포함하며, Row Level Security(RLS)를 통한 데이터 보안을 보장합니다.

### 핵심 목표
- Supabase 프로젝트 생성 및 환경별 구성 (개발/스테이징/프로덕션)
- 데이터베이스 스키마 설계 및 마이그레이션 관리
- RLS 정책을 통한 역할 기반 데이터 접근 제어
- 타입 안전한 Supabase 클라이언트 래퍼 구현

---

## EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)
- 시스템은 Supabase를 데이터베이스 및 인증 백엔드로 사용해야 한다
- 시스템은 개발/스테이징/프로덕션 환경별 독립적인 Supabase 프로젝트를 제공해야 한다
- 시스템은 TypeScript 타입 안전성을 보장하는 Supabase 클라이언트를 제공해야 한다
- 시스템은 데이터베이스 마이그레이션 버전 관리 기능을 제공해야 한다

### Event-driven Requirements (이벤트 기반)
- WHEN Supabase 클라이언트가 초기화되면, 시스템은 환경별 설정(URL, Anon Key, Service Key)을 적용해야 한다
- WHEN 데이터베이스 스키마가 변경되면, 시스템은 마이그레이션 파일을 생성하고 버전을 관리해야 한다
- WHEN 클라이언트 측에서 Supabase를 사용하면, 시스템은 브라우저 클라이언트를 제공해야 한다
- WHEN 서버 측에서 Supabase를 사용하면, 시스템은 서버 전용 클라이언트를 제공해야 한다
- WHEN 관리자 권한이 필요하면, 시스템은 Service Role Key를 사용하는 Admin 클라이언트를 제공해야 한다

### State-driven Requirements (상태 기반)
- WHILE 데이터베이스 쿼리가 실행될 때, 시스템은 RLS 정책을 통해 접근 권한을 검증해야 한다
- WHILE 사용자가 인증되지 않은 상태일 때, 시스템은 공개 데이터만 접근 가능하도록 제한해야 한다
- WHILE RLS 정책이 활성화된 상태일 때, 시스템은 사용자 역할에 따라 데이터 접근을 제한해야 한다

### Constraints (제약사항)
- 모든 민감한 환경 변수는 `.env.local`에만 저장하고 Git에 커밋하지 않아야 한다
- Service Role Key는 서버 사이드에서만 사용하고 클라이언트에 노출되지 않아야 한다
- 데이터베이스 테이블은 생성 시 RLS가 기본 활성화되어야 한다
- 모든 테이블은 `created_at`, `updated_at` 타임스탬프를 포함해야 한다
- 소프트 삭제 패턴을 사용하여 `deleted_at` 필드로 논리 삭제해야 한다

---

## 데이터베이스 스키마 설계

### 핵심 테이블

#### 1. `users` - 사용자 정보
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'lawyer', 'admin')),
  association_id UUID REFERENCES associations(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_association ON users(association_id);
```

#### 2. `associations` - 교원단체/협회
```sql
CREATE TABLE associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('teachers_union', 'bar_association')),
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_associations_code ON associations(code);
CREATE INDEX idx_associations_type ON associations(type);
```

#### 3. `reports` - 교권 침해 신고
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('parent', 'student', 'colleague', 'other')),
  incident_date DATE NOT NULL,
  location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'assigned', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_anonymous BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
```

#### 4. `consultations` - 법률 상담
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id),
  lawyer_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'active', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_consultations_report ON consultations(report_id);
CREATE INDEX idx_consultations_lawyer ON consultations(lawyer_id);
CREATE INDEX idx_consultations_status ON consultations(status);
```

#### 5. `messages` - 상담 메시지
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES consultations(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_consultation ON messages(consultation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

#### 6. `evidence_files` - 증거 파일
```sql
CREATE TABLE evidence_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_evidence_report ON evidence_files(report_id);
```

---

## Row Level Security (RLS) 정책

### 1. `users` 테이블 RLS
```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 자신의 정보 조회 (모든 역할)
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- 자신의 정보 수정 (모든 역할)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 관리자는 모든 사용자 조회
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 관리자는 사용자 생성/수정/삭제
CREATE POLICY "Admins can manage users"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 2. `reports` 테이블 RLS
```sql
-- RLS 활성화
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 신고 조회
CREATE POLICY "Teachers can view own reports"
ON reports FOR SELECT
USING (user_id = auth.uid());

-- 교사는 자신의 신고 생성
CREATE POLICY "Teachers can create reports"
ON reports FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 변호사는 배정된 신고 조회
CREATE POLICY "Lawyers can view assigned reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consultations
    WHERE consultations.report_id = reports.id
    AND consultations.lawyer_id = auth.uid()
  )
);

-- 관리자는 모든 신고 조회
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 3. `consultations` 테이블 RLS
```sql
-- RLS 활성화
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 교사는 자신의 신고 관련 상담 조회
CREATE POLICY "Teachers can view own consultations"
ON consultations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reports
    WHERE reports.id = consultations.report_id
    AND reports.user_id = auth.uid()
  )
);

-- 변호사는 자신에게 배정된 상담 조회
CREATE POLICY "Lawyers can view assigned consultations"
ON consultations FOR SELECT
USING (lawyer_id = auth.uid());

-- 변호사는 상담 업데이트 (상태 변경)
CREATE POLICY "Lawyers can update assigned consultations"
ON consultations FOR UPDATE
USING (lawyer_id = auth.uid());

-- 관리자는 모든 상담 조회
CREATE POLICY "Admins can view all consultations"
ON consultations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 4. `messages` 테이블 RLS
```sql
-- RLS 활성화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 상담 참여자는 메시지 조회
CREATE POLICY "Consultation participants can view messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN reports r ON r.id = c.report_id
    WHERE c.id = messages.consultation_id
    AND (r.user_id = auth.uid() OR c.lawyer_id = auth.uid())
  )
);

-- 상담 참여자는 메시지 생성
CREATE POLICY "Consultation participants can create messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN reports r ON r.id = c.report_id
    WHERE c.id = messages.consultation_id
    AND (r.user_id = auth.uid() OR c.lawyer_id = auth.uid())
    AND sender_id = auth.uid()
  )
);
```

---

## 환경 변수 설정

### `.env.local` (개발 환경)
```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 설정
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# 환경 식별
NEXT_PUBLIC_ENV=development
```

### `.env.production` (프로덕션 환경)
```bash
# Supabase 설정 (Vercel 환경 변수로 설정)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# JWT 설정
JWT_SECRET=
JWT_EXPIRES_IN=24h

# 환경 식별
NEXT_PUBLIC_ENV=production
```

### `.env.example` (Git 커밋용 템플릿)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Environment
NEXT_PUBLIC_ENV=development
```

---

## Supabase 클라이언트 구현

### 1. 브라우저 클라이언트 (`client.ts`)
```typescript
// @CODE:INFRA-001:CLIENT | SPEC: SPEC-INFRA-001.md
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 2. 서버 클라이언트 (`server.ts`)
```typescript
// @CODE:INFRA-001:SERVER | SPEC: SPEC-INFRA-001.md
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );
}
```

### 3. Admin 클라이언트 (`admin.ts`)
```typescript
// @CODE:INFRA-001:ADMIN | SPEC: SPEC-INFRA-001.md
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key 사용
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

---

## 타입 안전성

### 데이터베이스 타입 생성
```bash
# Supabase CLI로 타입 생성
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

### 타입 사용 예시
```typescript
import type { Database } from '@/types/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Consultation = Database['public']['Tables']['consultations']['Row'];
```

---

## 마이그레이션 관리

### 초기 마이그레이션 생성
```bash
# Supabase CLI 초기화
npx supabase init

# 마이그레이션 생성
npx supabase migration new initial_schema

# 로컬 DB 시작
npx supabase start

# 마이그레이션 적용
npx supabase db push

# 타입 생성
npx supabase gen types typescript --local > src/types/database.types.ts
```

---

## 보안 고려사항

### 1. 환경 변수 보안
- Service Role Key는 절대 클라이언트에 노출하지 않음
- `.env.local`은 `.gitignore`에 추가
- Vercel 환경 변수로 프로덕션 키 관리

### 2. RLS 정책
- 모든 테이블에 RLS 기본 활성화
- 역할별 접근 권한 명확히 정의
- 정책 테스트 코드 작성

### 3. 데이터 암호화
- 전송: TLS 1.3 (Supabase 기본 제공)
- 저장: AES-256 (Supabase 기본 제공)
- 민감 데이터: 애플리케이션 레벨 추가 암호화 (Phase 2)

---

## 성능 최적화

### 1. 인덱싱 전략
- `users.email`, `reports.status`, `consultations.lawyer_id` 등 주요 검색 컬럼에 인덱스 생성
- 복합 인덱스로 자주 사용되는 쿼리 패턴 최적화

### 2. Connection Pooling
- Supabase는 PgBouncer를 통해 자동 Connection Pooling 제공
- 최대 연결 수: 프로젝트 플랜에 따라 조정

### 3. 쿼리 최적화
- `select()` 시 필요한 컬럼만 명시
- 페이지네이션 적용 (`.range()`)
- 실시간 구독 시 필터링 활용

---

## 참조

- **프로젝트 문서**: `.moai/project/structure.md` - Supabase 통합 아키텍처
- **기술 스택**: `.moai/project/tech.md` - Supabase 설정 및 도구
- **데이터 모델**: PRD 5.2 데이터 모델
- **보안 정책**: PRD 6.2 데이터 보안

---

## 다음 단계

1. **Supabase 프로젝트 생성**: 개발/스테이징/프로덕션 환경별 프로젝트
2. **스키마 마이그레이션**: 초기 테이블 및 RLS 정책 적용
3. **클라이언트 구현**: `/alfred:2-build INFRA-001` 실행
4. **타입 생성 및 검증**: TypeScript 타입 안전성 확보
5. **AUTH-001 SPEC 작성**: 인증 시스템 구현 준비
