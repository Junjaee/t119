# INFRA-001 수락 기준 (Acceptance Criteria)

> **SPEC**: `SPEC-INFRA-001.md` - Supabase 통합 설정
>
> **테스트 전략**: Given-When-Then 시나리오 기반 검증

---

## 개요

이 문서는 INFRA-001 SPEC의 완료 조건을 정의합니다. 모든 시나리오가 통과해야 SPEC이 완료된 것으로 간주됩니다.

---

## 시나리오 1: Supabase 프로젝트 생성 및 환경 설정

### Given (준비)
- Supabase 계정이 생성되어 있음
- Next.js 14 프로젝트가 초기화되어 있음
- `.env.example` 파일이 존재함

### When (실행)
- Supabase 대시보드에서 3개 프로젝트 생성 (개발/스테이징/프로덕션)
- 각 프로젝트의 URL과 Anon Key를 환경 변수 파일에 작성
- `npx supabase login` 및 `npx supabase link` 실행

### Then (검증)
- ✅ Supabase 대시보드에 3개 프로젝트가 생성되어 있음
- ✅ `.env.local` 파일에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`가 존재함
- ✅ `.env.local`이 `.gitignore`에 포함되어 있음
- ✅ `npx supabase status` 명령어가 성공적으로 실행됨
- ✅ 환경 변수가 Next.js 애플리케이션에서 로딩됨 (`console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`)

**테스트 방법**:
```typescript
// @TEST:INFRA-001-ENV | SPEC: SPEC-INFRA-001.md
import { describe, it, expect } from 'vitest';

describe('Environment Variables', () => {
  it('should load Supabase URL from environment', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it('should load Supabase Anon Key from environment', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toHaveLength(128); // JWT 길이
  });

  it('should load Service Role Key from environment', () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toHaveLength(128);
  });
});
```

---

## 시나리오 2: 데이터베이스 스키마 생성

### Given (준비)
- Supabase 프로젝트가 생성되어 있음
- Supabase CLI가 설치되어 있음
- 마이그레이션 파일이 작성되어 있음

### When (실행)
- `npx supabase migration new initial_schema` 실행
- SQL 파일에 6개 테이블 스키마 작성
- `npx supabase db push` 실행

### Then (검증)
- ✅ Supabase 대시보드에 6개 테이블 생성 확인 (users, associations, reports, consultations, messages, evidence_files)
- ✅ 각 테이블에 `created_at`, `updated_at` 컬럼 존재
- ✅ `deleted_at` 컬럼으로 소프트 삭제 지원
- ✅ 외래 키 제약 조건 설정 (예: `reports.user_id` → `users.id`)
- ✅ 인덱스 생성 확인 (예: `idx_users_email`, `idx_reports_status`)

**테스트 방법**:
```sql
-- Supabase SQL Editor에서 실행
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'associations', 'reports', 'consultations', 'messages', 'evidence_files');

-- 결과: 6개 테이블 반환

-- created_at, updated_at 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('created_at', 'updated_at', 'deleted_at');

-- 외래 키 확인
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'reports';
```

---

## 시나리오 3: Row Level Security (RLS) 정책 적용

### Given (준비)
- 데이터베이스 테이블이 생성되어 있음
- 테스트 사용자 계정 3개 생성 (teacher, lawyer, admin)

### When (실행)
- 각 테이블에 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 실행
- 역할별 RLS 정책 생성 (SELECT, INSERT, UPDATE, DELETE)
- 테스트 사용자로 로그인 후 쿼리 실행

### Then (검증)
- ✅ 모든 테이블에 RLS가 활성화되어 있음
- ✅ 교사는 자신의 신고만 조회 가능
- ✅ 변호사는 배정된 신고만 조회 가능
- ✅ 관리자는 모든 데이터 조회 가능
- ✅ 권한 없는 사용자의 쿼리는 빈 배열 반환 또는 에러 발생

**테스트 방법**:
```typescript
// @TEST:INFRA-001-RLS | SPEC: SPEC-INFRA-001.md
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';

describe('RLS Policies - Teacher', () => {
  let teacherClient: any;
  let teacherId: string;
  let reportId: string;

  beforeAll(async () => {
    // 테스트 교사 계정 생성
    const admin = createAdminClient();
    const { data: user } = await admin.auth.admin.createUser({
      email: 'teacher-test@example.com',
      password: 'password123',
      email_confirm: true,
    });
    teacherId = user.user!.id;

    // 교사 정보 INSERT
    await admin.from('users').insert({
      id: teacherId,
      email: 'teacher-test@example.com',
      role: 'teacher',
      name: 'Test Teacher',
    });

    // 신고 생성
    const { data: report } = await admin.from('reports').insert({
      user_id: teacherId,
      title: 'Test Report',
      description: 'Test Description',
      category: 'parent',
      incident_date: '2025-10-20',
    }).select().single();
    reportId = report.id;

    // 교사 계정으로 로그인
    teacherClient = createClient();
    await teacherClient.auth.signInWithPassword({
      email: 'teacher-test@example.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    const admin = createAdminClient();
    await admin.from('reports').delete().eq('id', reportId);
    await admin.from('users').delete().eq('id', teacherId);
    await admin.auth.admin.deleteUser(teacherId);
  });

  it('should allow teachers to view own reports', async () => {
    const { data, error } = await teacherClient
      .from('reports')
      .select('*')
      .eq('user_id', teacherId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(reportId);
  });

  it('should prevent teachers from viewing other reports', async () => {
    const { data, error } = await teacherClient
      .from('reports')
      .select('*')
      .neq('user_id', teacherId);

    expect(data).toHaveLength(0);
  });

  it('should allow teachers to create reports', async () => {
    const { data, error } = await teacherClient
      .from('reports')
      .insert({
        user_id: teacherId,
        title: 'New Report',
        description: 'New Description',
        category: 'student',
        incident_date: '2025-10-21',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.user_id).toBe(teacherId);

    // 정리
    await createAdminClient().from('reports').delete().eq('id', data.id);
  });

  it('should prevent teachers from updating other reports', async () => {
    // 다른 사용자 신고 생성
    const admin = createAdminClient();
    const { data: otherUser } = await admin.from('users').insert({
      email: 'other-teacher@example.com',
      role: 'teacher',
      name: 'Other Teacher',
    }).select().single();

    const { data: otherReport } = await admin.from('reports').insert({
      user_id: otherUser.id,
      title: 'Other Report',
      description: 'Other Description',
      category: 'parent',
      incident_date: '2025-10-20',
    }).select().single();

    // 교사가 다른 사용자 신고 수정 시도
    const { error } = await teacherClient
      .from('reports')
      .update({ title: 'Hacked Title' })
      .eq('id', otherReport.id);

    expect(error).toBeDefined();

    // 정리
    await admin.from('reports').delete().eq('id', otherReport.id);
    await admin.from('users').delete().eq('id', otherUser.id);
  });
});

describe('RLS Policies - Lawyer', () => {
  let lawyerClient: any;
  let lawyerId: string;
  let consultationId: string;

  beforeAll(async () => {
    const admin = createAdminClient();
    const { data: user } = await admin.auth.admin.createUser({
      email: 'lawyer-test@example.com',
      password: 'password123',
      email_confirm: true,
    });
    lawyerId = user.user!.id;

    await admin.from('users').insert({
      id: lawyerId,
      email: 'lawyer-test@example.com',
      role: 'lawyer',
      name: 'Test Lawyer',
    });

    // 상담 생성 (특정 신고에 배정)
    const { data: consultation } = await admin.from('consultations').insert({
      report_id: 'some-report-id',
      lawyer_id: lawyerId,
      status: 'assigned',
    }).select().single();
    consultationId = consultation.id;

    lawyerClient = createClient();
    await lawyerClient.auth.signInWithPassword({
      email: 'lawyer-test@example.com',
      password: 'password123',
    });
  });

  it('should allow lawyers to view assigned consultations', async () => {
    const { data, error } = await lawyerClient
      .from('consultations')
      .select('*')
      .eq('lawyer_id', lawyerId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(consultationId);
  });

  it('should prevent lawyers from viewing unassigned consultations', async () => {
    const { data, error } = await lawyerClient
      .from('consultations')
      .select('*')
      .neq('lawyer_id', lawyerId);

    expect(data).toHaveLength(0);
  });
});

describe('RLS Policies - Admin', () => {
  let adminClient: any;
  let adminId: string;

  beforeAll(async () => {
    const admin = createAdminClient();
    const { data: user } = await admin.auth.admin.createUser({
      email: 'admin-test@example.com',
      password: 'password123',
      email_confirm: true,
    });
    adminId = user.user!.id;

    await admin.from('users').insert({
      id: adminId,
      email: 'admin-test@example.com',
      role: 'admin',
      name: 'Test Admin',
    });

    adminClient = createClient();
    await adminClient.auth.signInWithPassword({
      email: 'admin-test@example.com',
      password: 'password123',
    });
  });

  it('should allow admins to view all reports', async () => {
    const { data, error } = await adminClient.from('reports').select('*');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // 모든 신고 조회 가능
  });

  it('should allow admins to view all users', async () => {
    const { data, error } = await adminClient.from('users').select('*');

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

---

## 시나리오 4: Supabase 클라이언트 래퍼 구현

### Given (준비)
- Supabase 프로젝트가 설정되어 있음
- 환경 변수가 로딩됨
- `@supabase/supabase-js`, `@supabase/ssr` 패키지가 설치됨

### When (실행)
- `src/lib/supabase/client.ts` 파일 생성 (브라우저 클라이언트)
- `src/lib/supabase/server.ts` 파일 생성 (서버 클라이언트)
- `src/lib/supabase/admin.ts` 파일 생성 (Admin 클라이언트)
- 각 클라이언트에서 Supabase 쿼리 실행

### Then (검증)
- ✅ 브라우저 클라이언트가 정상적으로 생성됨
- ✅ 서버 클라이언트가 쿠키 핸들러를 통해 세션 관리
- ✅ Admin 클라이언트가 Service Role Key로 RLS 우회 가능
- ✅ TypeScript 타입 안전성 보장 (컴파일 에러 없음)
- ✅ 각 클라이언트로 쿼리 실행 성공

**테스트 방법**:
```typescript
// @TEST:INFRA-001-CLIENT | SPEC: SPEC-INFRA-001.md
import { describe, it, expect } from 'vitest';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Browser Client', () => {
  it('should create browser client successfully', () => {
    const client = createBrowserClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
  });

  it('should have correct Supabase URL', () => {
    const client = createBrowserClient();
    // @ts-ignore - accessing private property for testing
    expect(client.supabaseUrl).toBe(process.env.NEXT_PUBLIC_SUPABASE_URL);
  });
});

describe('Server Client', () => {
  it('should create server client successfully', () => {
    const client = createServerClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
    expect(client.from).toBeDefined();
  });
});

describe('Admin Client', () => {
  it('should create admin client successfully', () => {
    const client = createAdminClient();
    expect(client).toBeDefined();
    expect(client.auth.admin).toBeDefined(); // Admin methods
  });

  it('should bypass RLS with Service Role Key', async () => {
    const client = createAdminClient();

    // RLS 우회하여 모든 사용자 조회
    const { data, error } = await client.from('users').select('*');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    // RLS 정책 무시하고 모든 데이터 조회 가능
  });
});
```

---

## 시나리오 5: TypeScript 타입 생성 및 사용

### Given (준비)
- 데이터베이스 스키마가 생성되어 있음
- Supabase CLI가 설치되어 있음

### When (실행)
- `npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts` 실행
- 생성된 타입을 애플리케이션에서 사용

### Then (검증)
- ✅ `src/types/database.types.ts` 파일 생성 확인
- ✅ `Database` 타입에 6개 테이블 정의 포함
- ✅ 각 테이블의 `Row`, `Insert`, `Update` 타입 존재
- ✅ TypeScript 컴파일 에러 없음
- ✅ IDE 자동완성 지원 (IntelliSense)

**테스트 방법**:
```typescript
// @TEST:INFRA-001-TYPES | SPEC: SPEC-INFRA-001.md
import { describe, it, expect, expectTypeOf } from 'vitest';
import type { Database } from '@/types/database.types';

describe('Database Types', () => {
  it('should have correct User type', () => {
    type User = Database['public']['Tables']['users']['Row'];

    expectTypeOf<User>().toHaveProperty('id');
    expectTypeOf<User>().toHaveProperty('email');
    expectTypeOf<User>().toHaveProperty('role');
    expectTypeOf<User>().toHaveProperty('created_at');
  });

  it('should have correct Report type', () => {
    type Report = Database['public']['Tables']['reports']['Row'];

    expectTypeOf<Report>().toHaveProperty('id');
    expectTypeOf<Report>().toHaveProperty('user_id');
    expectTypeOf<Report>().toHaveProperty('title');
    expectTypeOf<Report>().toHaveProperty('status');
  });

  it('should enforce type safety on insert', () => {
    type ReportInsert = Database['public']['Tables']['reports']['Insert'];

    const validInsert: ReportInsert = {
      user_id: 'user-id',
      title: 'Title',
      description: 'Description',
      category: 'parent',
      incident_date: '2025-10-20',
    };

    expect(validInsert).toBeDefined();

    // TypeScript 컴파일 에러 발생 (테스트 실행 시 확인)
    // const invalidInsert: ReportInsert = {
    //   user_id: 'user-id',
    //   title: 123, // ❌ 타입 에러
    // };
  });
});
```

---

## 시나리오 6: 스토리지 버킷 설정 및 파일 업로드

### Given (준비)
- Supabase 프로젝트가 생성되어 있음
- 3개 버킷이 생성되어 있음 (evidence, documents, avatars)
- 버킷 정책이 설정되어 있음

### When (실행)
- 교사가 증거 파일 업로드
- 변호사가 배정된 신고의 증거 파일 다운로드
- 권한 없는 사용자가 증거 파일 접근 시도

### Then (검증)
- ✅ 교사는 자신의 신고에 파일 업로드 가능
- ✅ 변호사는 배정된 신고의 파일 다운로드 가능
- ✅ 권한 없는 사용자는 파일 접근 차단
- ✅ 파일 크기 제한 (10MB) 적용
- ✅ 파일 형식 제한 (이미지, PDF만 허용)

**테스트 방법**:
```typescript
// @TEST:INFRA-001-STORAGE | SPEC: SPEC-INFRA-001.md
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@/lib/supabase/client';
import { uploadEvidence } from '@/utils/storage';

describe('Storage - Evidence Bucket', () => {
  let teacherClient: any;
  let teacherId: string;
  let reportId: string;

  beforeAll(async () => {
    // 테스트 교사 및 신고 생성
    // (시나리오 3과 동일)
  });

  it('should allow teachers to upload evidence files', async () => {
    const file = new File(['test content'], 'evidence.jpg', {
      type: 'image/jpeg',
    });

    const filePath = await uploadEvidence(reportId, file);

    expect(filePath).toBeDefined();
    expect(filePath).toContain(reportId);

    // 업로드 확인
    const { data, error } = await teacherClient.storage
      .from('evidence')
      .list(reportId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it('should prevent uploading files larger than 10MB', async () => {
    const largeFile = new File(
      [new ArrayBuffer(11 * 1024 * 1024)], // 11MB
      'large-evidence.jpg',
      { type: 'image/jpeg' }
    );

    await expect(uploadEvidence(reportId, largeFile)).rejects.toThrow();
  });

  it('should prevent uploading non-allowed file types', async () => {
    const invalidFile = new File(['test'], 'script.js', {
      type: 'application/javascript',
    });

    await expect(uploadEvidence(reportId, invalidFile)).rejects.toThrow();
  });
});
```

---

## 품질 게이트 기준

### 코드 품질
- ✅ ESLint 에러 0개
- ✅ TypeScript 컴파일 에러 0개
- ✅ Prettier 포맷팅 적용

### 테스트 커버리지
- ✅ 단위 테스트 커버리지 ≥ 85%
- ✅ 통합 테스트 통과율 100%

### 보안
- ✅ RLS 정책 100% 적용
- ✅ Service Role Key 서버 전용
- ✅ 환경 변수 노출 없음 (`.gitignore`)

### 성능
- ✅ 데이터베이스 쿼리 응답 시간 < 100ms
- ✅ 파일 업로드 속도 < 2초 (1MB 기준)

---

## 완료 조건 (Definition of Done)

### 필수 조건
- [ ] 6개 시나리오 모두 통과
- [ ] 모든 테스트 케이스 통과 (단위/통합)
- [ ] TypeScript 컴파일 에러 0개
- [ ] ESLint 에러 0개
- [ ] RLS 정책 보안 감사 통과

### 문서화
- [ ] `spec.md` 최종 버전 확정
- [ ] `plan.md`에 실제 구현 시간 기록
- [ ] `acceptance.md`에 테스트 결과 기록
- [ ] README.md에 Supabase 설정 가이드 추가

### 배포 준비
- [ ] 스테이징 환경 테스트 완료
- [ ] 프로덕션 환경 변수 설정 완료
- [ ] 백업 및 롤백 계획 수립

---

## 검증 방법 요약

| 검증 항목 | 방법 | 도구 |
|-----------|------|------|
| 환경 변수 로딩 | 단위 테스트 | Vitest |
| 데이터베이스 스키마 | SQL 쿼리 | Supabase SQL Editor |
| RLS 정책 | 통합 테스트 | Vitest + Supabase Client |
| 클라이언트 래퍼 | 단위 테스트 | Vitest |
| TypeScript 타입 | 타입 테스트 | Vitest + expectTypeOf |
| 스토리지 버킷 | 통합 테스트 | Vitest + File Upload |

---

## 참조 문서

- **SPEC**: `SPEC-INFRA-001.md` - 상세 요구사항
- **PLAN**: `plan.md` - 구현 계획
- **Supabase RLS 가이드**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js + Supabase Auth**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
