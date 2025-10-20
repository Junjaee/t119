# SPEC-REPORT-001: 구현 계획 (Implementation Plan)

> **문서 정보**
> - **SPEC ID**: REPORT-001
> - **버전**: 0.0.1
> - **작성일**: 2025-10-20
> - **우선순위**: Critical

---

## 구현 우선순위 (Implementation Priority)

### 우선순위 High (1차 목표)
1. **신고 데이터 모델 구현** (Database Schema + API)
2. **신고 작성 폼** (UI + Validation)
3. **신고 목록/상세 조회** (CRUD Read)

### 우선순위 Medium (2차 목표)
4. **파일 업로드 시스템** (Supabase Storage)
5. **개인정보 자동 마스킹** (PII Detection)
6. **신고 상태 관리** (Status Flow)

### 우선순위 Low (3차 목표)
7. **상태 변경 이력 추적** (Audit Log)
8. **실시간 알림** (Status Change Notification)
9. **성능 최적화** (캐싱, 인덱싱)

---

## 기술적 접근 방법 (Technical Approach)

### 1. 데이터베이스 설계

#### Supabase 마이그레이션 전략
```sql
-- Migration 001: reports 테이블
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date TIMESTAMP NOT NULL,
  incident_location TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_lawyer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration 002: report_files 테이블
CREATE TABLE report_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration 003: report_status_history 테이블
CREATE TABLE report_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Row Level Security (RLS) 정책
```sql
-- reports 테이블 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 교사: 본인 신고만 조회
CREATE POLICY "Teachers can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

-- 교사: 본인 신고만 작성
CREATE POLICY "Teachers can create own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 변호사: 배정된 신고만 조회
CREATE POLICY "Lawyers can view assigned reports"
  ON reports FOR SELECT
  USING (auth.uid() = assigned_lawyer_id);

-- 관리자: 모든 신고 조회
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

### 2. API 설계 (Next.js App Router)

#### 디렉토리 구조
```
src/app/api/reports/
├── route.ts                    # GET /api/reports (목록), POST (작성)
├── [id]/
│   ├── route.ts                # GET, PUT, DELETE
│   └── files/
│       ├── route.ts            # POST (파일 업로드)
│       └── [fileId]/
│           ├── route.ts        # DELETE
│           └── download/
│               └── route.ts    # GET (Signed URL)
```

#### API 구현 전략

**GET /api/reports** (목록 조회)
```typescript
// src/app/api/reports/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  // JWT 검증 (AUTH-001 의존)
  const user = await verifyToken(request);
  if (!user) return unauthorized();

  // Supabase 쿼리
  const { data, error, count } = await supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', status || undefined)
    .eq('priority', priority || undefined)
    .range((page - 1) * limit, page * limit - 1)
    .order('created_at', { ascending: false });

  return json({
    data,
    pagination: { total: count, page, limit }
  });
}
```

**POST /api/reports** (신고 작성)
```typescript
export async function POST(request: Request) {
  const user = await verifyToken(request);
  if (!user || user.role !== 'teacher') return forbidden();

  const body = await request.json();

  // Zod 스키마 검증
  const schema = z.object({
    category: z.enum(['parent', 'student', 'colleague']),
    sub_category: z.string().min(1).max(100),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    incident_date: z.string().datetime(),
    incident_location: z.string().max(200).optional(),
    priority: z.enum(['normal', 'high', 'critical']).default('normal'),
  });

  const validated = schema.parse(body);

  // 개인정보 자동 마스킹
  const maskedDescription = maskPII(validated.description);

  // Supabase 삽입
  const { data, error } = await supabase
    .from('reports')
    .insert({
      ...validated,
      description: maskedDescription,
      user_id: user.id,
    })
    .select()
    .single();

  return json({ report: data }, { status: 201 });
}
```

### 3. 프론트엔드 구현

#### 컴포넌트 구조
```
src/app/reports/
├── page.tsx                    # 신고 목록 페이지
├── new/
│   └── page.tsx                # 신고 작성 페이지
├── [id]/
│   └── page.tsx                # 신고 상세 페이지
└── components/
    ├── ReportForm.tsx          # 신고 작성 폼
    ├── ReportList.tsx          # 신고 목록
    ├── ReportCard.tsx          # 신고 카드
    ├── FileUploader.tsx        # 파일 업로드
    └── StatusBadge.tsx         # 상태 뱃지
```

#### Zustand 상태 관리
```typescript
// src/stores/report-store.ts
interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  loading: boolean;
  error: string | null;

  fetchReports: (filters?: ReportFilters) => Promise<void>;
  fetchReportById: (id: string) => Promise<void>;
  createReport: (data: CreateReportDTO) => Promise<Report>;
  updateReport: (id: string, data: Partial<Report>) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  currentReport: null,
  loading: false,
  error: null,

  fetchReports: async (filters) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/reports?${new URLSearchParams(filters)}`);
      const { data } = await response.json();
      set({ reports: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // ... 기타 메서드
}));
```

### 4. 파일 업로드 시스템

#### Supabase Storage 설정
```typescript
// src/lib/storage/file-uploader.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadReportFile(
  reportId: string,
  file: File
): Promise<ReportFile> {
  // 파일 검증
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);

  // Supabase Storage에 업로드
  const fileName = `${reportId}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('report-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // report_files 테이블에 메타데이터 저장
  const { data: fileData, error: dbError } = await supabase
    .from('report_files')
    .insert({
      report_id: reportId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: data.path,
    })
    .select()
    .single();

  return fileData;
}
```

#### 파일 다운로드 (Signed URL)
```typescript
export async function getFileDownloadUrl(
  fileId: string
): Promise<{ url: string; expiresIn: number }> {
  // report_files에서 storage_path 조회
  const { data: file } = await supabase
    .from('report_files')
    .select('storage_path')
    .eq('id', fileId)
    .single();

  // Signed URL 생성 (1시간 유효)
  const { data, error } = await supabase.storage
    .from('report-files')
    .createSignedUrl(file.storage_path, 3600);

  return { url: data.signedUrl, expiresIn: 3600 };
}
```

### 5. 개인정보 자동 마스킹

#### PII 탐지 알고리즘
```typescript
// src/lib/utils/anonymization.ts
export function maskPII(text: string): string {
  let masked = text;

  // 1. 전화번호 (010-XXXX-XXXX)
  masked = masked.replace(/01[0-9]-[0-9]{3,4}-[0-9]{4}/g, (match) => {
    return match.split('-')[0] + '-****-****';
  });

  // 2. 이메일
  masked = masked.replace(
    /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)/g,
    (match, user, domain) => user[0] + '***@' + domain
  );

  // 3. 한글 이름 (2-4자)
  masked = masked.replace(/([가-힣]){2,4}(?=\s|님|씨|선생|학생)/g, (match) => {
    if (match.length === 2) return match[0] + '*';
    if (match.length === 3) return match[0] + '*' + match[2];
    return match[0] + '**' + match[3];
  });

  // 4. 주민등록번호
  masked = masked.replace(/\d{6}-\d{7}/g, '******-*******');

  return masked;
}
```

### 6. 상태 관리 시스템

#### 상태 전환 로직
```typescript
// src/lib/services/report-status.ts
export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  userId: string,
  notes?: string
): Promise<void> {
  // 현재 상태 조회
  const { data: report } = await supabase
    .from('reports')
    .select('status')
    .eq('id', reportId)
    .single();

  const oldStatus = report.status;

  // 상태 전환 유효성 검증
  if (!isValidTransition(oldStatus, newStatus)) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`);
  }

  // 상태 업데이트
  await supabase
    .from('reports')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', reportId);

  // 상태 변경 이력 기록
  await supabase
    .from('report_status_history')
    .insert({
      report_id: reportId,
      from_status: oldStatus,
      to_status: newStatus,
      changed_by: userId,
      notes,
    });

  // 알림 전송 (추후 구현)
  // await sendStatusChangeNotification(reportId, newStatus);
}

function isValidTransition(from: ReportStatus, to: ReportStatus): boolean {
  const validTransitions: Record<ReportStatus, ReportStatus[]> = {
    submitted: ['assigned'],
    assigned: ['in_progress'],
    in_progress: ['resolved'],
    resolved: ['closed', 'in_progress'], // 재개 가능
    closed: [],
  };

  return validTransitions[from]?.includes(to) || false;
}
```

---

## 아키텍처 설계 방향 (Architecture Design)

### 레이어 구조
```
┌─────────────────────────────────────┐
│   Presentation Layer                │
│   (Next.js Pages + Components)      │
├─────────────────────────────────────┤
│   Application Layer                 │
│   (Zustand Stores + Hooks)          │
├─────────────────────────────────────┤
│   Domain Layer                      │
│   (Business Logic + Validators)     │
├─────────────────────────────────────┤
│   Infrastructure Layer              │
│   (Supabase Client + API Routes)    │
└─────────────────────────────────────┘
```

### 의존성 주입 (Dependency Injection)
```typescript
// src/lib/services/report-service.ts
export class ReportService {
  constructor(
    private supabase: SupabaseClient,
    private fileUploader: FileUploader,
    private anonymizer: Anonymizer
  ) {}

  async createReport(data: CreateReportDTO): Promise<Report> {
    // 개인정보 마스킹
    const maskedDescription = this.anonymizer.mask(data.description);

    // Supabase 삽입
    const { data: report } = await this.supabase
      .from('reports')
      .insert({ ...data, description: maskedDescription })
      .select()
      .single();

    return report;
  }
}
```

### 에러 처리 전략
```typescript
// src/lib/errors/report-errors.ts
export class ReportNotFoundError extends Error {
  constructor(reportId: string) {
    super(`Report not found: ${reportId}`);
    this.name = 'ReportNotFoundError';
  }
}

export class UnauthorizedReportAccessError extends Error {
  constructor() {
    super('Unauthorized access to report');
    this.name = 'UnauthorizedReportAccessError';
  }
}

// API 에러 핸들러
export function handleApiError(error: Error): Response {
  if (error instanceof ReportNotFoundError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404
    });
  }

  if (error instanceof UnauthorizedReportAccessError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 403
    });
  }

  return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500
  });
}
```

---

## 리스크 및 대응 방안 (Risk Mitigation)

### 리스크 1: 파일 업로드 실패
**대응**:
- 재시도 로직 (exponential backoff)
- 파일 분할 업로드 (5MB 이상 시)
- 업로드 진행률 표시

### 리스크 2: PII 마스킹 누락
**대응**:
- 정규식 패턴 테스트 커버리지 100%
- 마스킹 전/후 비교 로그
- 관리자 수동 검수 도구 제공

### 리스크 3: 동시성 이슈 (상태 충돌)
**대응**:
- Optimistic Locking (updated_at 비교)
- Row Level Locking (FOR UPDATE)
- 상태 전환 트랜잭션 처리

### 리스크 4: 성능 저하 (대량 신고)
**대응**:
- 페이지네이션 (무한 스크롤)
- 인덱스 최적화 (status, created_at)
- Supabase Connection Pooling

---

## 테스트 전략 (Testing Strategy)

### Unit Tests (단위 테스트)
```typescript
// tests/unit/anonymization.test.ts
describe('maskPII', () => {
  test('전화번호 마스킹', () => {
    const input = '연락처: 010-1234-5678';
    const output = maskPII(input);
    expect(output).toBe('연락처: 010-****-****');
  });

  test('이메일 마스킹', () => {
    const input = '이메일: test@example.com';
    const output = maskPII(input);
    expect(output).toBe('이메일: t***@example.com');
  });

  test('한글 이름 마스킹', () => {
    expect(maskPII('홍길동 선생님')).toBe('홍*동 선생님');
    expect(maskPII('김철수님')).toBe('김*수님');
  });
});
```

### Integration Tests (통합 테스트)
```typescript
// tests/integration/reports-api.test.ts
describe('POST /api/reports', () => {
  test('신고 작성 성공', async () => {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        category: 'parent',
        sub_category: '폭언/욕설',
        title: '학부모 폭언 신고',
        description: '학부모가 전화로 욕설을 했습니다.',
        incident_date: '2025-10-20T10:00:00Z',
        priority: 'high',
      }),
    });

    expect(response.status).toBe(201);
    const { report } = await response.json();
    expect(report.status).toBe('submitted');
  });

  test('교사 역할이 아닌 경우 403', async () => {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${lawyerToken}` },
      body: JSON.stringify({ /* ... */ }),
    });

    expect(response.status).toBe(403);
  });
});
```

### E2E Tests (종단 간 테스트)
```typescript
// tests/e2e/report-submission.test.ts
describe('신고 제출 플로우', () => {
  test('신고 작성 → 파일 업로드 → 제출', async () => {
    // 1. 로그인
    await page.goto('/login');
    await page.fill('#email', 'teacher@test.com');
    await page.fill('#password', 'password');
    await page.click('#submit');

    // 2. 신고 작성 페이지
    await page.goto('/reports/new');
    await page.selectOption('#category', 'parent');
    await page.selectOption('#sub_category', '폭언/욕설');
    await page.fill('#title', '테스트 신고');
    await page.fill('#description', '내용');

    // 3. 파일 업로드
    await page.setInputFiles('#file-upload', './test-files/evidence.pdf');
    await page.waitForSelector('.file-uploaded');

    // 4. 제출
    await page.click('#submit-button');
    await page.waitForURL('/reports/*');

    // 5. 검증
    const status = await page.textContent('.status-badge');
    expect(status).toBe('제출됨');
  });
});
```

---

## 배포 체크리스트 (Deployment Checklist)

### Phase 1: 데이터베이스 준비
- [ ] Supabase 프로젝트 생성
- [ ] 마이그레이션 파일 작성 (reports, report_files, report_status_history)
- [ ] RLS 정책 적용
- [ ] Storage 버킷 생성 (`report-files`)
- [ ] 인덱스 생성 (성능 최적화)

### Phase 2: 백엔드 구현
- [ ] API 엔드포인트 구현
- [ ] JWT 검증 미들웨어 (AUTH-001 의존)
- [ ] PII 마스킹 유틸리티
- [ ] 파일 업로드/다운로드 서비스
- [ ] 상태 관리 로직

### Phase 3: 프론트엔드 구현
- [ ] 신고 작성 폼 (shadcn/ui)
- [ ] 신고 목록/상세 페이지
- [ ] 파일 업로더 컴포넌트
- [ ] Zustand 상태 관리
- [ ] 에러 처리 UI

### Phase 4: 테스트
- [ ] Unit Tests (커버리지 ≥85%)
- [ ] Integration Tests
- [ ] E2E Tests
- [ ] 성능 테스트 (Lighthouse, k6)

### Phase 5: 배포
- [ ] Vercel 배포 설정
- [ ] 환경 변수 설정 (Supabase URL/Key)
- [ ] Sentry 에러 모니터링 설정
- [ ] 프로덕션 데이터 마이그레이션

---

## 다음 단계 (Next Steps)

1. **즉시 시작**: `/alfred:2-build REPORT-001` 실행하여 TDD 구현 시작
2. **의존성 확인**: AUTH-001, INFRA-001 구현 상태 확인
3. **Supabase 설정**: 데이터베이스 마이그레이션 및 Storage 버킷 생성

**예상 태스크 순서**:
```
RED → 신고 모델 테스트 작성
GREEN → Supabase 쿼리 구현
REFACTOR → 타입 안전성 개선

RED → PII 마스킹 테스트
GREEN → 정규식 패턴 구현
REFACTOR → 성능 최적화

RED → 파일 업로드 테스트
GREEN → Supabase Storage 연동
REFACTOR → 에러 처리 강화
```
