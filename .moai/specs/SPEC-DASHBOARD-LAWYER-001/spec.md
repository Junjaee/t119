---
id: DASHBOARD-LAWYER-001
version: 0.0.1
status: draft
created: 2025-10-23
updated: 2025-10-23
author: @Claude
priority: high
category: feature
labels:
  - dashboard
  - backend-api
  - data-fetching
  - lawyer
depends_on:
  - UI-AUTH-001
  - DASHBOARD-001
  - DASHBOARD-TEACHER-001
related_specs:
  - DASHBOARD-TEACHER-001
  - DASHBOARD-ADMIN-001
scope:
  packages:
    - src/features/dashboard/hooks
    - src/features/dashboard/services
    - src/app/api/dashboard
  files:
    - useDashboardData.ts
    - dashboardService.ts
    - route.ts
---

# @SPEC:DASHBOARD-LAWYER-001: 변호사 대시보드 백엔드 API 연결 및 데이터 조회

## HISTORY

### v0.0.1 (2025-10-23)
- **INITIAL**: 변호사 대시보드 백엔드 API 연결 명세 초안 작성
- **AUTHOR**: @Claude
- **SCOPE**: 배정된 사건 조회, 상담 이력 조회, 통계 계산
- **CONTEXT**: SPEC-DASHBOARD-TEACHER-001 완료 후 추진, 동일한 기술 패턴 적용
- **DIFFERENCE**: 데이터 소스 변경 (reports.user_id → reports.assigned_lawyer_id, consultations.lawyer_id 필터)

---

## 1. 개요 (Overview)

### 1.1 목적
교사119 플랫폼의 **변호사 대시보드 백엔드 API 연결**을 통해 다음을 보장:
- **실시간 데이터**: 변호사에게 배정된 사건 현황, 상담 이력, 통계 조회
- **자동 갱신**: 5분 주기 자동 데이터 리프레시 (React Query 활용)
- **에러 처리**: 네트워크 오류, 인증 실패, 데이터 부재 상황 대응
- **성능 최적화**: 병렬 페칭, 캐싱, 로딩 상태 관리

### 1.2 배경
- **현황**:
  - UI-AUTH-001 인증 시스템 완료 (v0.1.0, status: completed)
  - DASHBOARD-001 대시보드 UI 구현 완료 (교사/변호사/관리자 페이지)
  - DASHBOARD-TEACHER-001 교사 대시보드 API 완료 (참조 가능한 패턴 확립)
  - `useDashboardData` 훅 존재하지만 변호사 역할 데이터 소스 미연결
- **문제점**:
  - 로그인 후 변호사 대시보드 진입 시 빈 화면 또는 Mock 데이터 표시
  - `dashboardService.ts`의 `fetchLawyerDashboardData` 함수가 구현되지 않음
  - 변호사 역할에 맞는 데이터 필터링 로직 부재 (assigned_lawyer_id vs teacher_id)
- **해결**: Teacher SPEC과 동일한 Supabase Direct Client 기반 데이터 페칭 구현

### 1.3 범위
- **포함**:
  - 변호사 대시보드 데이터 조회 API (`GET /api/dashboard/lawyer` 또는 Direct Client)
  - `useDashboardData` 훅의 lawyer 역할 연결 강화
  - `dashboardService.ts`의 `fetchLawyerDashboardData` 함수 구현
  - 로딩/에러/성공 상태 UI 연동
  - 5분 주기 자동 리프레시 (refetchInterval)
- **제외**:
  - 교사/관리자 대시보드 API → 별도 SPEC (DASHBOARD-TEACHER-001, DASHBOARD-ADMIN-001)
  - 대시보드 위젯 UI 수정 → DASHBOARD-001에서 완료
  - 실시간 WebSocket/SSE 알림 → Phase 2

---

## 2. EARS 요구사항 (EARS Requirements)

### 2.1 Environment (환경 및 가정사항)
- Next.js 14 App Router + Supabase Direct Client 환경
- React Query (TanStack Query v5) 이미 설정됨
- UI-AUTH-001 인증 시스템 완료 (JWT 토큰 로컬스토리지 저장)
- Supabase 테이블 존재:
  - `reports` (신고 데이터) - `assigned_lawyer_id` 필드로 변호사 배정
  - `consultations` (상담 이력) - `lawyer_id` 필드로 변호사 매칭
  - `users` (사용자 정보)
- DASHBOARD-001 UI 컴포넌트 완료:
  - `CaseStatsWidget` (변호사용 사건 통계)
  - `ConsultationWidget` (상담 이력)
  - `PersonalStatsWidget` (개인 통계)
  - `QuickActionsWidget`

### 2.2 Ubiquitous Requirements (기본 요구사항)
- 시스템은 **변호사에게 배정된 사건 현황 데이터**를 제공해야 한다
- 시스템은 **변호사 개인의 상담 이력 데이터**를 제공해야 한다
- 시스템은 **변호사 개인의 통계 데이터** (총 사건 수, 평균 처리 시간, 평균 평점)를 제공해야 한다
- 시스템은 **5분 주기로 자동 리프레시**해야 한다

### 2.3 Event-driven Requirements (이벤트 기반)
- **WHEN** 변호사가 대시보드 페이지에 진입하면, 시스템은 **즉시 데이터 조회를 시작**해야 한다
- **WHEN** API 요청이 실패하면, 시스템은 **3회 재시도 후 에러 메시지를 표시**해야 한다
- **WHEN** 사용자가 브라우저 포커스를 복귀하면, 시스템은 **자동으로 데이터를 갱신**해야 한다
- **WHEN** 데이터 조회 성공 시, 시스템은 **5분간 캐시를 유지**해야 한다

### 2.4 State-driven Requirements (상태 기반)
- **WHILE** 데이터 로딩 중일 때, 시스템은 **스켈레톤 UI를 표시**해야 한다
- **WHILE** 인증 토큰이 없을 때, 시스템은 **로그인 페이지로 리다이렉트**해야 한다
- **WHILE** 사용자가 변호사 역할이 아닐 때, 시스템은 **403 Forbidden 에러를 반환**해야 한다

### 2.5 Optional Features (선택적 기능)
- **WHERE** 사용자가 수동 새로고침 버튼을 클릭하면, 시스템은 **캐시를 무시하고 즉시 데이터를 갱신**할 수 있다
- **WHERE** 데이터가 없을 때, 시스템은 **빈 상태 UI (Empty State)**를 표시할 수 있다

### 2.6 Constraints (제약사항)
- **IF** API 요청이 10초를 초과하면, 시스템은 **타임아웃 에러를 발생**시켜야 한다
- **IF** Supabase 테이블에 데이터가 없으면, 시스템은 **빈 배열과 0 값을 반환**해야 한다 (에러 아님)
- 사건 현황은 **최근 5개만 표시** (성능 최적화)
- 평균 평점 계산 시 **소수점 1자리까지 표시**
- **CRITICAL**: 변호사는 `assigned_lawyer_id = auth.uid()` 조건으로 필터링된 사건만 조회 가능 (Supabase RLS)

---

## 3. 시스템 설계 (System Design)

### 3.1 아키텍처

#### 데이터 흐름
```
[변호사 대시보드 페이지]
    ↓
[useDashboardData('lawyer', userId)]
    ├─ queryKey: ['lawyer-dashboard', userId]
    ├─ queryFn: fetchLawyerDashboardData(userId)
    ├─ staleTime: 5분 (캐시 유지)
    ├─ refetchInterval: 5분 (자동 갱신)
    └─ retry: 3회
    ↓
[dashboardService.ts - fetchLawyerDashboardData]
    ↓ (병렬 페칭)
    ├─ Supabase: reports 테이블 조회 (assigned_lawyer_id = userId) ← TEACHER와 다름!
    ├─ Supabase: consultations 테이블 조회 (lawyer_id = userId) ← TEACHER와 다름!
    └─ Supabase: reports 테이블 통계 계산 (assigned_lawyer_id 기준)
    ↓
[React Query 캐싱 + UI 렌더링]
    ├─ 성공: 데이터 표시
    ├─ 로딩: 스켈레톤 UI
    └─ 에러: 에러 메시지 + 재시도 버튼
```

#### Teacher vs Lawyer 차이점
| 항목 | Teacher (DASHBOARD-TEACHER-001) | Lawyer (DASHBOARD-LAWYER-001) |
|------|----------------------------------|-------------------------------|
| 데이터 소스 | `reports.teacher_id = auth.uid()` | `reports.assigned_lawyer_id = auth.uid()` |
| 상담 필터 | `consultations.teacher_id = auth.uid()` | `consultations.lawyer_id = auth.uid()` |
| 사건 유형 | 교사가 신고한 사건 | 변호사에게 배정된 사건 |
| RLS 정책 | 본인이 작성한 신고만 조회 | 본인에게 배정된 사건만 조회 |

### 3.2 API 엔드포인트 (선택사항)

**Option A: Supabase Direct Client (현재 방식, 권장)**
- `dashboardService.ts`에서 직접 `createClient()` 호출
- 장점: 서버리스, 자동 인증, 타입 안전성
- 단점: 클라이언트 측 네트워크 비용

**Option B: Next.js API Route (필요 시)**
```
GET /api/dashboard/lawyer?userId={userId}
Authorization: Bearer {JWT}

Response:
{
  "cases": {
    "pending": 3,
    "inProgress": 2,
    "completed": 5,
    "recent": [...]
  },
  "consultations": {
    "scheduled": 1,
    "completed": 4,
    "nextScheduled": {...}
  },
  "stats": {
    "totalCases": 10,
    "avgProcessingTime": 15.5,
    "avgRating": 4.7
  }
}
```

**권장**: Option A (Supabase Direct Client) - Teacher SPEC과 일관성 유지

### 3.3 데이터 타입 (TypeScript)

```typescript
// src/features/dashboard/types/dashboard.types.ts
export interface LawyerDashboardData {
  cases: {
    pending: number;        // 대기 중인 사건
    inProgress: number;     // 진행 중인 사건
    completed: number;      // 완료된 사건
    recent: Array<{
      id: string;
      title: string;
      status: string;
      assigned_at: string;  // 배정일
      created_at: string;
    }>;
  };
  consultations: {
    scheduled: number;      // 예정된 상담
    completed: number;      // 완료된 상담
    total: number;          // 총 상담 수
    nextScheduled?: {
      id: string;
      scheduled_at: string;
      teacher_name: string; // 상담 신청 교사명
    };
  };
  stats: {
    totalCases: number;
    avgProcessingTime: number;  // 일 단위
    avgRating: number;
  };
}
```

### 3.4 데이터베이스 스키마 확인

#### reports 테이블 (사건)
```sql
-- 변호사 배정 관련 컬럼 확인
SELECT
  id,
  title,
  status,
  teacher_id,           -- 신고자 (교사)
  assigned_lawyer_id,   -- 배정된 변호사 ← Lawyer 대시보드 필터 기준!
  created_at,
  updated_at
FROM reports
WHERE assigned_lawyer_id = '<lawyer-uuid>';
```

#### consultations 테이블 (상담)
```sql
-- 변호사 상담 관련 컬럼 확인
SELECT
  id,
  teacher_id,           -- 상담 신청 교사
  lawyer_id,            -- 상담 담당 변호사 ← Lawyer 대시보드 필터 기준!
  status,
  scheduled_at,
  created_at
FROM consultations
WHERE lawyer_id = '<lawyer-uuid>';
```

### 3.5 에러 처리 전략

#### 에러 타입 분류
1. **네트워크 오류**: "서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요."
2. **인증 실패**: "로그인 세션이 만료되었습니다. 다시 로그인해주세요." → 로그인 페이지 리다이렉트
3. **권한 부족**: "접근 권한이 없습니다." (403)
4. **데이터 없음**: 에러 아님, 빈 상태 UI 표시 (신규 가입 변호사 또는 배정된 사건 없음)

#### 재시도 전략
```typescript
// React Query 재시도 설정 (Teacher와 동일)
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
```

---

## 4. 구현 상세 (Implementation Details)

### 4.1 useDashboardData 훅 활용

**현재 상태** (`src/features/dashboard/hooks/useDashboardData.ts`):
```typescript
export function useDashboardData<T extends DashboardRole>(
  role: T,
  userId: string,
  options?: UseDashboardDataOptions
) {
  const fetchFunction = {
    teacher: () => fetchTeacherDashboardData(userId),
    lawyer: () => fetchLawyerDashboardData(userId),  // ← 구현 필요!
    admin: () => fetchAdminDashboardData(),
  }[role];

  return useQuery<DashboardData<T>>({
    queryKey: [`${role}-dashboard`, userId],
    queryFn: fetchFunction as () => Promise<DashboardData<T>>,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
}
```

**변경 사항**:
- ✅ 훅 자체는 수정 불필요 (이미 lawyer 역할 지원)
- ⚠️ `fetchLawyerDashboardData` 함수 구현 필요 (아래 참조)

### 4.2 dashboardService.ts 구현

**새로 구현할 함수** (`src/features/dashboard/services/dashboardService.ts`):

```typescript
/**
 * @CODE:DASHBOARD-LAWYER-001 | SPEC: SPEC-DASHBOARD-LAWYER-001.md | TEST: tests/features/dashboard/services/dashboardService.test.ts
 *
 * 변호사 대시보드 데이터 조회
 * - reports 테이블: assigned_lawyer_id = userId 필터
 * - consultations 테이블: lawyer_id = userId 필터
 */
export async function fetchLawyerDashboardData(
  userId: string
): Promise<LawyerDashboardData> {
  const supabase = createClient();

  try {
    // 병렬 페칭 (성능 최적화)
    const [casesResult, consultationsResult, statsResult] = await Promise.all([
      // 1. 배정된 사건 조회 (최근 5개)
      supabase
        .from('reports')
        .select('id, title, status, created_at, assigned_at')
        .eq('assigned_lawyer_id', userId)  // ← Teacher와 다름!
        .order('assigned_at', { ascending: false })
        .limit(5),

      // 2. 상담 이력 조회
      supabase
        .from('consultations')
        .select(`
          id,
          status,
          scheduled_at,
          teacher:users!consultations_teacher_id_fkey(name)
        `)
        .eq('lawyer_id', userId)  // ← Teacher와 다름!
        .order('scheduled_at', { ascending: false }),

      // 3. 통계용 전체 사건 조회
      supabase
        .from('reports')
        .select('id, created_at, updated_at, status')
        .eq('assigned_lawyer_id', userId),
    ]);

    // 에러 체크
    if (casesResult.error) {
      throw new Error(`사건 데이터 조회 실패: ${casesResult.error.message}`);
    }
    if (consultationsResult.error) {
      throw new Error(`상담 데이터 조회 실패: ${consultationsResult.error.message}`);
    }
    if (statsResult.error) {
      throw new Error(`통계 데이터 조회 실패: ${statsResult.error.message}`);
    }

    const cases = casesResult.data || [];
    const consultations = consultationsResult.data || [];

    // 사건 상태별 카운트
    const pendingCases = cases.filter((c) => c.status === 'pending').length;
    const inProgressCases = cases.filter((c) => c.status === 'in_progress').length;
    const completedCases = cases.filter((c) => c.status === 'completed').length;

    // 상담 상태별 카운트
    const scheduledConsultations = consultations.filter(
      (c) => c.status === 'scheduled'
    ).length;
    const completedConsultations = consultations.filter(
      (c) => c.status === 'completed'
    ).length;

    // 다음 예정 상담
    const nextScheduled = consultations
      .filter((c) => c.status === 'scheduled' && new Date(c.scheduled_at) > new Date())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

    return {
      cases: {
        pending: pendingCases,
        inProgress: inProgressCases,
        completed: completedCases,
        recent: cases.slice(0, 5),
      },
      consultations: {
        scheduled: scheduledConsultations,
        completed: completedConsultations,
        total: consultations.length,
        nextScheduled: nextScheduled
          ? {
              id: nextScheduled.id,
              scheduled_at: nextScheduled.scheduled_at,
              teacher_name: nextScheduled.teacher?.name || '알 수 없음',
            }
          : undefined,
      },
      stats: {
        totalCases: cases.length,
        avgProcessingTime: calculateAvgProcessingTime(cases),
        avgRating: 4.7, // TODO: reviews 테이블 조인 (Phase 2)
      },
    };
  } catch (error) {
    console.error('[fetchLawyerDashboardData] Error:', error);
    throw new Error('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * Helper 함수: 평균 처리 시간 계산 (일 단위)
 */
function calculateAvgProcessingTime(
  cases: Array<{ created_at: string; updated_at?: string; status: string }>
): number {
  const completedCases = cases.filter((c) => c.status === 'completed' && c.updated_at);

  if (completedCases.length === 0) return 0;

  const totalDays = completedCases.reduce((sum, c) => {
    const createdDate = new Date(c.created_at);
    const updatedDate = new Date(c.updated_at!);
    const diffTime = Math.abs(updatedDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);

  return Math.round((totalDays / completedCases.length) * 10) / 10; // 소수점 1자리
}
```

### 4.3 UI 컴포넌트 연동

**변호사 대시보드 페이지** (`src/app/dashboard/lawyer/page.tsx`):
```typescript
export default function LawyerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardData(
    'lawyer',
    user?.id || '',
    {
      refetchInterval: 5 * 60 * 1000, // 5분
    }
  );

  // 인증 확인
  if (authLoading) return <DashboardSkeleton />;
  if (!user) {
    redirect('/auth/login');
  }

  // 로딩 상태
  if (isLoading) return <DashboardSkeleton />;

  // 에러 상태
  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">데이터 로딩 중 오류가 발생했습니다</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          재시도
        </button>
      </div>
    );
  }

  // 정상 렌더링
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CaseStatsWidget
        pending={data?.cases.pending || 0}
        inProgress={data?.cases.inProgress || 0}
        completed={data?.cases.completed || 0}
        recent={data?.cases.recent || []}
      />
      <ConsultationWidget
        scheduled={data?.consultations.scheduled || 0}
        completed={data?.consultations.completed || 0}
        total={data?.consultations.total || 0}
        nextScheduled={data?.consultations.nextScheduled}
      />
      <PersonalStatsWidget
        totalCases={data?.stats.totalCases || 0}
        avgProcessingTime={data?.stats.avgProcessingTime || 0}
        avgRating={data?.stats.avgRating || 0}
      />
      <QuickActionsWidget />
    </div>
  );
}
```

---

## 5. 테스트 전략 (Test Strategy)

### 5.1 단위 테스트
- **대상**: `fetchLawyerDashboardData` 함수
- **도구**: Vitest + Supabase Mock
- **시나리오**:
  - 정상 데이터 조회 성공 (assigned_lawyer_id 필터 확인)
  - Supabase 오류 발생 시 예외 전파
  - 빈 데이터 배열 처리 (신규 가입 변호사)
  - Helper 함수 검증 (calculateAvgProcessingTime)

**테스트 파일**: `tests/features/dashboard/services/dashboardService.test.ts`
```typescript
// @TEST:DASHBOARD-LAWYER-001 | SPEC: SPEC-DASHBOARD-LAWYER-001.md

describe('fetchLawyerDashboardData', () => {
  it('should fetch lawyer dashboard data successfully', async () => {
    // Given: Mock Supabase data
    mockSupabase.from('reports').select.mockResolvedValue({
      data: [
        { id: '1', title: 'Case 1', status: 'pending', assigned_at: '2025-10-23' },
        { id: '2', title: 'Case 2', status: 'in_progress', assigned_at: '2025-10-22' },
      ],
      error: null,
    });

    mockSupabase.from('consultations').select.mockResolvedValue({
      data: [
        { id: '1', status: 'scheduled', scheduled_at: '2025-10-25', teacher: { name: '홍길동' } },
      ],
      error: null,
    });

    // When: fetchLawyerDashboardData 호출
    const result = await fetchLawyerDashboardData('lawyer-uuid');

    // Then: 데이터 구조 확인
    expect(result.cases.pending).toBe(1);
    expect(result.cases.inProgress).toBe(1);
    expect(result.consultations.scheduled).toBe(1);
  });

  it('should handle empty data gracefully', async () => {
    // Given: 빈 배열
    mockSupabase.from('reports').select.mockResolvedValue({ data: [], error: null });
    mockSupabase.from('consultations').select.mockResolvedValue({ data: [], error: null });

    // When
    const result = await fetchLawyerDashboardData('lawyer-uuid');

    // Then: 0 값 반환 (에러 아님)
    expect(result.cases.pending).toBe(0);
    expect(result.stats.totalCases).toBe(0);
  });
});
```

### 5.2 통합 테스트
- **대상**: `useDashboardData('lawyer', userId)` 훅 + `fetchLawyerDashboardData`
- **도구**: Vitest + Testing Library + MSW
- **시나리오**:
  - React Query 캐싱 동작 확인
  - 5분 자동 리프레시 확인
  - 3회 재시도 확인
  - 에러 상태 UI 연동 확인

### 5.3 E2E 테스트
- **대상**: 변호사 로그인 → 대시보드 접근 → 데이터 표시
- **도구**: Playwright
- **시나리오**:
  - 로그인 성공 후 변호사 대시보드 데이터 표시
  - 네트워크 오류 시 에러 메시지 표시
  - 재시도 버튼 클릭 시 재조회

---

## 6. 성능 요구사항 (Performance Requirements)

### 6.1 응답 시간
- **데이터 조회**: < 1초 (병렬 페칭 활용)
- **캐시 히트**: < 10ms (React Query 메모리 캐시)

### 6.2 네트워크 최적화
- **병렬 페칭**: `Promise.all` 사용으로 3개 쿼리 동시 실행
- **데이터 제한**: `limit(5)`로 최근 사건만 조회
- **캐싱**: 5분간 동일 데이터 재사용 (불필요한 API 호출 방지)

### 6.3 렌더링 최적화
- **스켈레톤 UI**: 로딩 중 레이아웃 쉬프트 방지
- **메모이제이션**: 위젯 컴포넌트 `React.memo` 사용

---

## 7. 보안 요구사항 (Security Requirements)

### 7.1 인증 확인
- **클라이언트**: `useAuth` 훅으로 로그인 상태 확인
- **Supabase**: RLS (Row Level Security) 정책으로 변호사 본인 데이터만 조회 허용

### 7.2 데이터 접근 제어 (Supabase RLS 정책)

```sql
-- reports 테이블: 변호사는 본인에게 배정된 사건만 조회
CREATE POLICY "변호사는 배정된 사건만 조회"
ON reports FOR SELECT
USING (
  auth.uid()::TEXT = assigned_lawyer_id::TEXT
);

-- consultations 테이블: 변호사는 본인이 담당하는 상담만 조회
CREATE POLICY "변호사는 담당 상담만 조회"
ON consultations FOR SELECT
USING (
  auth.uid()::TEXT = lawyer_id::TEXT
);
```

### 7.3 데이터 민감도
- **Public**: 사건 ID, 제목, 상태
- **Protected**: 변호사 평점, 처리 시간
- **Private**: 교사 개인정보 (상담 시만 노출)

---

## 8. 의존성 (Dependencies)

### 8.1 선행 요구사항
- **UI-AUTH-001**: 로그인/인증 시스템 (v0.1.0, completed) ✅
- **DASHBOARD-001**: 대시보드 UI 컴포넌트 (v0.1.0, completed) ✅
- **DASHBOARD-TEACHER-001**: 교사 대시보드 API (v0.1.0, completed) ✅ (패턴 참조)

### 8.2 차단하는 SPEC
- **DASHBOARD-ADMIN-001**: 관리자 대시보드 API (유사 패턴 참조)

### 8.3 외부 라이브러리
- `@tanstack/react-query`: v5.x (이미 설치) ✅
- `@supabase/supabase-js`: v2.x (이미 설치) ✅

---

## 9. 향후 확장 (Future Enhancements)

### Phase 2
- **실시간 알림**: WebSocket/SSE 기반 사건 배정 알림
- **평균 평점 계산**: reviews 테이블 조인 (현재 Mock 값)
- **차트 데이터**: 월별 사건 추이, 처리 시간 트렌드

### Phase 3
- **오프라인 지원**: Service Worker + IndexedDB 캐싱
- **추천 기능**: AI 기반 유사 사례 추천
- **보고서 생성**: PDF/Excel 다운로드

---

## 10. Acceptance Criteria (상세)

> 자세한 Given-When-Then 시나리오는 `acceptance.md` 참조

### 시나리오 1: 정상 데이터 조회
- **Given**: 변호사가 로그인하고
- **And**: 대시보드 페이지에 진입했을 때
- **When**: 데이터 조회가 시작되면
- **Then**: 1초 이내에 사건 현황, 상담 이력, 통계가 표시된다
- **And**: 5분 후 자동으로 데이터가 갱신된다

### 시나리오 2: 배정된 사건 없음 (신규 변호사)
- **Given**: 신규 가입한 변호사가 로그인했을 때
- **When**: 대시보드 페이지에 진입하면
- **Then**: "배정된 사건이 없습니다" 빈 상태 UI가 표시된다
- **And**: 에러 메시지 없이 정상 렌더링된다

### 시나리오 3: 에러 처리
- **Given**: 변호사가 대시보드 페이지에 진입했을 때
- **When**: Supabase 연결 실패 시
- **Then**: "데이터 로딩 중 오류가 발생했습니다" 메시지가 표시되고
- **And**: 재시도 버튼이 표시된다

---

## 11. Teacher vs Lawyer 차이점 요약

| 항목 | Teacher (DASHBOARD-TEACHER-001) | Lawyer (DASHBOARD-LAWYER-001) |
|------|----------------------------------|-------------------------------|
| **데이터 소스** | `reports.teacher_id` | `reports.assigned_lawyer_id` |
| **상담 필터** | `consultations.teacher_id` | `consultations.lawyer_id` |
| **사건 유형** | 본인이 신고한 사건 | 배정받은 사건 |
| **상태 분류** | pending/completed | pending/in_progress/completed |
| **RLS 정책** | 본인 신고만 조회 | 배정된 사건만 조회 |
| **통계 기준** | 작성일 기준 | 배정일 기준 |
| **다음 일정** | nextScheduled (상담) | nextScheduled (상담) |

---

## 12. 참고 자료 (References)

- **UI-AUTH-001**: 로그인/인증 시스템 SPEC
- **DASHBOARD-001**: 대시보드 UI 컴포넌트 SPEC
- **DASHBOARD-TEACHER-001**: 교사 대시보드 API SPEC (패턴 참조)
- **React Query 문서**: https://tanstack.com/query/latest
- **Supabase 문서**: https://supabase.com/docs

---

**작성자**: @Claude
**리뷰어**: (승인 대기)
**최종 수정일**: 2025-10-23
