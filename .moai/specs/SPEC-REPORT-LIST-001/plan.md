# SPEC-REPORT-LIST-001 구현 계획서

> **신고 목록 및 상세 조회 페이지 구현 계획**

---

## 1. 구현 개요

### 목표
사용자(교사/변호사/관리자)가 신고 목록을 조회하고, 개별 신고의 상세 정보를 확인할 수 있는 페이지를 구현합니다. 페이지네이션, 필터링, 정렬, 실시간 업데이트 기능을 포함합니다.

### 구현 범위
- 신고 목록 페이지 (/reports)
- 신고 상세 페이지 (/reports/[id])
- 신고 목록 API (GET /api/reports)
- 신고 상세 API (GET /api/reports/[id])
- 필터링/정렬/페이지네이션
- 상태 배지 및 실시간 업데이트

---

## 2. 우선순위별 구현 단계

### 1차 목표: 기본 목록 조회
- [ ] 신고 목록 페이지 라우트 생성 (/reports)
- [ ] GET /api/reports API 구현
- [ ] React Query useQuery 통합
- [ ] ReportList 컴포넌트 구현
- [ ] ReportCard 컴포넌트 구현
- [ ] 스켈레톤 로딩 UI

### 2차 목표: 상세 조회
- [ ] 신고 상세 페이지 라우트 생성 (/reports/[id])
- [ ] GET /api/reports/[id] API 구현
- [ ] ReportDetailView 컴포넌트 구현
- [ ] 증거 파일 다운로드 (Signed URL)
- [ ] 권한 검증 (RLS)

### 3차 목표: 필터링 및 페이지네이션
- [ ] ReportFilters 컴포넌트 (상태, 카테고리, 검색)
- [ ] 페이지네이션 컴포넌트
- [ ] URL 쿼리 파라미터 동기화
- [ ] React Query 캐싱 전략

### 4차 목표: 고급 기능
- [ ] 실시간 업데이트 (5분 주기)
- [ ] 정렬 기능 (생성일, 우선순위)
- [ ] 상태 배지 컴포넌트
- [ ] 빈 목록 처리 (Empty State)
- [ ] 에러 처리 및 재시도

---

## 3. 기술적 접근 방법

### 3.1 데이터 페칭 전략
- **React Query**: 서버 상태 관리, 캐싱, 자동 갱신
- **SWR 대안**: React Query 선택 (더 강력한 캐싱)
- **실시간 업데이트**: refetchInterval 5분

### 3.2 권한 검증 전략
- **RLS (Row Level Security)**: Supabase PostgreSQL 정책
- **서버 사이드 검증**: API 라우트에서 재확인
- **클라이언트 검증**: 불필요한 요청 차단

### 3.3 상태 관리
- **서버 상태**: React Query (신고 목록, 상세)
- **UI 상태**: useState (필터, 페이지)
- **URL 상태**: Next.js useSearchParams (쿼리 파라미터)

### 3.4 페이지네이션 전략
- **서버 사이드 페이지네이션**: API에서 LIMIT/OFFSET 처리
- **클라이언트 캐싱**: React Query로 이전 페이지 캐싱
- **URL 동기화**: 페이지 번호를 쿼리 파라미터로 관리

---

## 4. 아키텍처 설계

### 4.1 컴포넌트 구조

```
/reports (page.tsx)
  └─ ReportList (ReportList.tsx)
      ├─ ReportFilters (ReportFilters.tsx)
      │   ├─ StatusFilter (Dropdown)
      │   ├─ CategoryFilter (Dropdown)
      │   └─ SearchInput
      ├─ ReportCard[] (ReportCard.tsx)
      │   ├─ ReportStatusBadge (ReportStatusBadge.tsx)
      │   ├─ Title
      │   ├─ Date
      │   └─ Priority
      └─ ReportPagination (ReportPagination.tsx)

/reports/[id] (page.tsx)
  └─ ReportDetailView (ReportDetailView.tsx)
      ├─ ReportStatusBadge
      ├─ ReportMetadata (날짜, 우선순위, 카테고리)
      ├─ ReportDescription
      ├─ EvidenceFileList
      │   └─ FileDownloadButton[]
      └─ LawyerInfo (배정된 경우)
```

### 4.2 데이터 흐름

```
사용자 접근
  ↓
/reports 페이지 로드
  ↓
useReports 훅 (React Query)
  ↓
GET /api/reports?page=1&limit=20
  ↓
Supabase PostgreSQL (RLS 적용)
  ↓
응답: { data, pagination }
  ↓
ReportList 렌더링
  ↓
5분 후 자동 갱신 (refetchInterval)
```

---

## 5. 파일 구조

```
src/app/reports/
├── page.tsx                        # /reports 페이지 (목록)
├── [id]/
│   └── page.tsx                    # /reports/[id] 페이지 (상세)
├── layout.tsx                      # (선택) 레이아웃
└── loading.tsx                     # 로딩 스피너

src/components/reports/
├── ReportList.tsx                  # 신고 목록 컴포넌트
├── ReportCard.tsx                  # 신고 카드 컴포넌트
├── ReportDetailView.tsx            # 신고 상세 뷰 컴포넌트
├── ReportStatusBadge.tsx           # 상태 배지 컴포넌트
├── ReportFilters.tsx               # 필터 컴포넌트
├── ReportPagination.tsx            # 페이지네이션 컴포넌트
└── EmptyState.tsx                  # 빈 목록 UI

src/app/api/reports/
├── route.ts                        # GET /api/reports (목록)
└── [id]/
    └── route.ts                    # GET /api/reports/[id] (상세)

src/lib/hooks/
├── useReports.ts                   # 신고 목록 훅
└── useReportDetail.ts              # 신고 상세 훅

src/lib/utils/
├── report-status.ts                # 상태 매핑 유틸
└── file-download.ts                # 파일 다운로드 유틸
```

---

## 6. 핵심 구현 상세

### 6.1 useReports 훅 (useReports.ts)

```typescript
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

interface UseReportsOptions {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}

export function useReports(options: UseReportsOptions = {}) {
  const searchParams = useSearchParams();

  const queryParams = {
    page: options.page || Number(searchParams.get('page')) || 1,
    limit: options.limit || 20,
    status: options.status || searchParams.get('status') || undefined,
    category: options.category || searchParams.get('category') || undefined,
    search: options.search || searchParams.get('search') || undefined,
  };

  return useQuery({
    queryKey: ['reports', queryParams],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(queryParams)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      );

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('신고 목록 조회 실패');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 5 * 60 * 1000, // 5분 주기 자동 갱신
  });
}
```

### 6.2 GET /api/reports API (route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // 3. Supabase 쿼리 빌드
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('teacher_id', user.id) // RLS로 자동 필터링됨
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // 필터 적용
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('신고 목록 조회 실패:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

### 6.3 ReportCard 컴포넌트 (ReportCard.tsx)

```typescript
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ReportStatusBadge } from './ReportStatusBadge';
import type { Report } from '@/types/report';

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Link href={`/reports/${report.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <ReportStatusBadge status={report.status} />
            <h3 className="text-lg font-semibold mt-2">{report.title}</h3>
            <p className="text-sm text-gray-500">
              {format(new Date(report.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium ${
              report.priority === 'critical' ? 'text-red-600' :
              report.priority === 'high' ? 'text-orange-600' :
              report.priority === 'medium' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
              {report.priority.toUpperCase()}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {report.description}
        </p>
        {report.lawyer && (
          <p className="text-sm text-blue-600 mt-2">
            담당: {report.lawyer.name}
          </p>
        )}
      </div>
    </Link>
  );
}
```

### 6.4 ReportStatusBadge 컴포넌트 (ReportStatusBadge.tsx)

```typescript
import type { Report } from '@/types/report';

const STATUS_CONFIG = {
  submitted: { label: '대기 중', color: 'bg-gray-200 text-gray-700' },
  assigned: { label: '배정됨', color: 'bg-blue-200 text-blue-700' },
  in_progress: { label: '진행 중', color: 'bg-orange-200 text-orange-700' },
  resolved: { label: '해결됨', color: 'bg-green-200 text-green-700' },
  closed: { label: '종료됨', color: 'bg-slate-400 text-white' },
};

interface ReportStatusBadgeProps {
  status: Report['status'];
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const { label, color } = STATUS_CONFIG[status];

  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
```

---

## 7. 리스크 및 대응 방안

### 7.1 대량 데이터 로드
- **문제**: 신고가 1000개 이상일 때 성능 저하
- **대응**:
  - 서버 사이드 페이지네이션 (LIMIT/OFFSET)
  - React Query 캐싱으로 이전 페이지 재사용
  - 무한 스크롤 대신 페이지네이션 사용

### 7.2 실시간 업데이트 충돌
- **문제**: 사용자가 편집 중일 때 자동 갱신으로 데이터 유실
- **대응**:
  - 편집 모드에서는 자동 갱신 중지
  - 충돌 발생 시 사용자에게 경고 메시지

### 7.3 권한 우회 시도
- **문제**: URL 직접 접근으로 타인의 신고 조회 시도
- **대응**:
  - Supabase RLS 정책 필수 적용
  - API 라우트에서 재검증
  - 403 Forbidden 반환

---

## 8. 테스트 전략

### 8.1 단위 테스트
- useReports 훅 (쿼리 파라미터 생성)
- ReportStatusBadge (상태별 색상)
- GET /api/reports API (필터링, 페이지네이션)

### 8.2 통합 테스트
- 목록 조회 → 필터 적용 → 페이지 이동
- 상세 조회 → 파일 다운로드
- 권한 검증 (타인의 신고 접근 차단)

### 8.3 E2E 테스트
- 신고 목록 조회 및 렌더링
- 상태별 필터링
- 페이지네이션 이동
- 신고 상세 페이지 접근
- 파일 다운로드

---

## 9. 성능 최적화

- **React Query 캐싱**: staleTime 5분, cacheTime 10분
- **무한 스크롤 제거**: 페이지네이션 사용 (더 빠른 초기 로드)
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **지연 로딩**: ReportDetailView 동적 임포트

---

## 10. 접근성 체크리스트

- [ ] 모든 카드에 `aria-label` 또는 명확한 제목
- [ ] 상태 배지에 `role="status"` 또는 `aria-label`
- [ ] 페이지네이션 버튼에 `aria-label` (예: "2페이지로 이동")
- [ ] 키보드 네비게이션 지원 (Tab, Enter)
- [ ] 스크린 리더 지원 (ARIA 속성)

---

## 11. Supabase RLS 정책

### 교사 정책
```sql
-- 교사는 자신의 신고만 조회
CREATE POLICY "teachers_view_own_reports"
  ON reports FOR SELECT
  USING (auth.uid() = teacher_id);

-- 교사는 자신의 신고만 생성
CREATE POLICY "teachers_create_own_reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);
```

### 변호사 정책
```sql
-- 변호사는 배정된 신고만 조회
CREATE POLICY "lawyers_view_assigned_reports"
  ON reports FOR SELECT
  USING (auth.uid() = lawyer_id);

-- 변호사는 배정된 신고만 수정
CREATE POLICY "lawyers_update_assigned_reports"
  ON reports FOR UPDATE
  USING (auth.uid() = lawyer_id);
```

### 관리자 정책
```sql
-- 관리자는 모든 신고 조회
CREATE POLICY "admins_view_all_reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

---

## 12. 배포 체크리스트

- [ ] Supabase RLS 정책 적용
- [ ] API 라우트 인증 미들웨어 적용
- [ ] React Query 캐싱 설정 확인
- [ ] 에러 로깅 설정 (Sentry 등)
- [ ] 성능 모니터링 설정 (Vercel Analytics)
- [ ] 실시간 업데이트 동작 확인

---

**작성자**: @Alfred
**최종 업데이트**: 2025-10-23
