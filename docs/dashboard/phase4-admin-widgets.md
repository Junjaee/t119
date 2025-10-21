# @DOC:DASHBOARD-001: Phase 4 - 관리자 대시보드 위젯

> SPEC: `.moai/specs/SPEC-DASHBOARD-001/spec.md` (v0.2.0)
> Phase: 4 (Admin Widgets)
> Status: completed
> Last Updated: 2025-10-21

## 개요

관리자 대시보드의 핵심 위젯 4개를 구현합니다. 전체 시스템 통계, 사용자 관리, 시스템 모니터링, 매칭 현황을 표시하여 관리자가 시스템 전체를 한눈에 파악할 수 있도록 합니다.

**핵심 목표**:
- 전체 시스템 통계 표시 (사용자, 신고, 매칭, 상담)
- 신규 가입 사용자 및 활성 사용자 추이 시각화
- 시스템 성능 모니터링 (응답 시간, 에러, DB 부하)
- 매칭 현황 및 성공률 분석

---

## Phase 4 위젯 (4개)

### 1. SystemStatsWidget - 전체 통계

**파일 위치**: `src/features/dashboard/widgets/admin/SystemStatsWidget.tsx`
**TAG**: `@CODE:DASHBOARD-001:ADMIN-WIDGETS`
**테스트**: `tests/features/dashboard/widgets/admin/system-stats-widget.test.tsx`
**상태**: ✅ completed

#### 기능

- 총 사용자 수 (교사 + 변호사 분리 표시)
- 총 신고 건수
- 총 매칭 건수
- 총 상담 건수
- 4개의 StatsCard로 그리드 레이아웃 구성

#### 데이터 인터페이스

```typescript
export interface SystemStatsData {
  /** 교사 수 */
  teacherCount: number;
  /** 변호사 수 */
  lawyerCount: number;
  /** 신고 건수 */
  reportCount: number;
  /** 매칭 건수 */
  matchCount: number;
  /** 상담 건수 */
  consultationCount: number;
}
```

#### 컴포넌트 Props

```typescript
export interface SystemStatsWidgetProps {
  /** 통계 데이터 */
  data?: SystemStatsData;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 메시지 */
  error?: string;
}
```

#### 사용 예시

```tsx
<SystemStatsWidget
  data={{
    teacherCount: 150,
    lawyerCount: 80,
    reportCount: 320,
    matchCount: 245,
    consultationCount: 180,
  }}
/>
```

#### 상태 처리

- **로딩**: SkeletonCard 표시
- **에러**: 에러 메시지와 함께 Card 표시
- **데이터 없음**: "데이터를 불러올 수 없습니다" 메시지 표시
- **정상**: 4개 StatsCard로 그리드 표시

#### 기술 스택

- **UI**: shadcn/ui Card, StatsCard
- **아이콘**: lucide-react (Users, FileText, GitMerge, MessageSquare)
- **스타일**: Tailwind CSS (grid, gap-4)

---

### 2. UserManagementWidget - 사용자 관리

**파일 위치**: `src/features/dashboard/widgets/admin/UserManagementWidget.tsx`
**TAG**: `@CODE:DASHBOARD-001:ADMIN-WIDGETS`
**테스트**: `tests/features/dashboard/widgets/admin/user-management-widget.test.tsx`
**상태**: ✅ completed

#### 기능

- DAU (Daily Active Users) 및 MAU (Monthly Active Users) 표시
- 신규 가입 사용자 (최근 7일) 추이를 BarChart로 시각화
- 역할별 (교사/변호사) 신규 가입자 분리 표시
- 승인 대기 중인 사용자 목록 표시

#### 데이터 인터페이스

```typescript
export interface UserManagementData {
  /** 신규 가입 사용자 (최근 7일) */
  newUsers: {
    /** 교사 수 */
    teacher: number;
    /** 변호사 수 */
    lawyer: number;
  };
  /** 활성 사용자 */
  activeUsers: {
    /** DAU (Daily Active Users) */
    dau: number;
    /** MAU (Monthly Active Users) */
    mau: number;
  };
  /** 승인 대기 목록 */
  pendingApprovals: Array<{
    /** 사용자 ID */
    id: string;
    /** 이름 */
    name: string;
    /** 역할 */
    role: 'teacher' | 'lawyer';
    /** 가입일 */
    createdAt: string;
  }>;
}
```

#### 시각화

- **차트 타입**: BarChart (역할별 신규 가입자)
- **라이브러리**: Recharts
- **높이**: 200px

#### 사용 예시

```tsx
<UserManagementWidget
  data={{
    newUsers: { teacher: 12, lawyer: 8 },
    activeUsers: { dau: 450, mau: 1200 },
    pendingApprovals: [
      {
        id: 'user-1',
        name: '김철수',
        role: 'teacher',
        createdAt: '2025-10-21',
      },
    ],
  }}
/>
```

#### 레이아웃

1. **활성 사용자 Stats** (2열)
   - DAU (primary variant)
   - MAU (default variant)

2. **신규 가입 차트** (BarChart, 200px)
   - X축: role (교사/변호사)
   - Y축: count

3. **요약 텍스트**
   - 역할별 신규 가입자 수

4. **승인 대기 목록**
   - 빈 상태: "승인 대기 중인 사용자가 없습니다"
   - 목록 아이템: 이름, 역할 Badge, 가입일

#### 기술 스택

- **차트**: Recharts BarChart
- **UI**: Card, StatsCard, Badge
- **아이콘**: 없음 (Badge로 역할 표시)

---

### 3. SystemMonitoringWidget - 시스템 모니터링

**파일 위치**: `src/features/dashboard/widgets/admin/SystemMonitoringWidget.tsx`
**TAG**: `@CODE:DASHBOARD-001:ADMIN-WIDGETS`
**테스트**: `tests/features/dashboard/widgets/admin/system-monitoring-widget.test.tsx`
**상태**: ✅ completed

#### 기능

- 평균 응답 시간 (ms) 표시
- 에러 발생 건수 표시
- 데이터베이스 부하 (%) 표시
- 시스템 상태 Badge (정상/주의/위험)
- 응답 시간 추이를 LineChart로 시각화 (선택)

#### 데이터 인터페이스

```typescript
export interface SystemMonitoringData {
  /** 평균 응답 시간 (ms) */
  avgResponseTime: number;
  /** 에러 발생 건수 */
  errorCount: number;
  /** 데이터베이스 부하 (%) */
  dbLoad: number;
  /** 시스템 상태 */
  healthStatus: 'healthy' | 'warning' | 'critical';
  /** 응답 시간 추이 (선택) */
  responseTimeTrend?: Array<{
    /** 시간 */
    time: string;
    /** 응답 시간 (ms) */
    value: number;
  }>;
}
```

#### 상태 매핑

```typescript
const statusConfig = {
  healthy: { label: '정상', variant: 'default' },
  warning: { label: '주의', variant: 'secondary' },
  critical: { label: '위험', variant: 'destructive' },
};
```

#### 경고 조건

| 지표 | 경고 임계값 | 위험 임계값 |
|------|-----------|-----------|
| 응답 시간 | 200ms 초과 | - |
| 에러 건수 | 5개 초과 | - |
| DB 부하 | 70% 초과 | - |

#### 시각화

- **차트 타입**: LineChart (응답 시간 추이, 선택)
- **라이브러리**: Recharts
- **높이**: 200px
- **데이터 조건**: `responseTimeTrend && responseTimeTrend.length > 0`

#### 레이아웃

1. **헤더 + 상태 Badge**
   - 제목: "시스템 모니터링"
   - 상태 Badge (정상/주의/위험)

2. **3열 Stats**
   - 응답 시간 (ms)
   - 에러 건수 (개)
   - DB 부하 (%)

3. **응답 시간 추이 차트** (조건부)
   - LineChart with tooltip

#### 사용 예시

```tsx
<SystemMonitoringWidget
  data={{
    avgResponseTime: 150,
    errorCount: 2,
    dbLoad: 45,
    healthStatus: 'healthy',
    responseTimeTrend: [
      { time: '12:00', value: 120 },
      { time: '12:05', value: 145 },
      { time: '12:10', value: 150 },
    ],
  }}
/>
```

---

### 4. MatchingStatusWidget - 매칭 현황

**파일 위치**: `src/features/dashboard/widgets/admin/MatchingStatusWidget.tsx`
**TAG**: `@CODE:DASHBOARD-001:ADMIN-WIDGETS`
**테스트**: `tests/features/dashboard/widgets/admin/matching-status-widget.test.tsx`
**상태**: ✅ completed

#### 기능

- 대기 중인 매칭 수 표시
- 평균 매칭 시간 (분 단위)
- 매칭 성공률 (%)
- 매칭 상태 분포를 PieChart로 시각화 (대기/매칭/취소)
- 대기 건수 30개 이상 시 경고 표시

#### 데이터 인터페이스

```typescript
export interface MatchingStatusData {
  /** 대기 중인 매칭 수 */
  pendingMatches: number;
  /** 평균 매칭 시간 (초) */
  avgMatchTime: number;
  /** 매칭 성공률 (%) */
  successRate: number;
  /** 매칭 상태 분포 */
  statusDistribution: {
    /** 대기 중 */
    pending: number;
    /** 매칭 완료 */
    matched: number;
    /** 취소됨 */
    cancelled: number;
  };
}
```

#### 경고 조건

| 지표 | 경고 임계값 |
|------|-----------|
| 대기 중 매칭 | 30개 이상 |
| 평균 매칭 시간 | 10분 초과 |
| 성공률 | 80% 미만 |

#### 시각화

- **차트 타입**: PieChart (매칭 상태 분포)
- **라이브러리**: Recharts
- **높이**: 250px
- **색상 매핑**:
  - 대기: #f59e0b (amber)
  - 매칭: #10b981 (emerald)
  - 취소: #ef4444 (red)

#### 단위 변환

- 평균 매칭 시간: 초 → 분 (`Math.round(avgMatchTime / 60)`)

#### 레이아웃

1. **3열 Stats**
   - 대기 중 (경고: 30개 이상)
   - 평균 시간 (경고: 10분 초과, 분 단위 표시)
   - 성공률 (성공: 80% 이상, 경고: 80% 미만)

2. **PieChart - 매칭 상태 분포**
   - 대기, 매칭, 취소 3가지 상태
   - Legend와 Tooltip 포함

#### 사용 예시

```tsx
<MatchingStatusWidget
  data={{
    pendingMatches: 25,
    avgMatchTime: 1800, // 30분
    successRate: 92,
    statusDistribution: {
      pending: 25,
      matched: 220,
      cancelled: 8,
    },
  }}
/>
```

---

## 전체 통계

### 파일 구조

```
src/features/dashboard/widgets/admin/
├── SystemStatsWidget.tsx
├── UserManagementWidget.tsx
├── SystemMonitoringWidget.tsx
└── MatchingStatusWidget.tsx

tests/features/dashboard/widgets/admin/
├── system-stats-widget.test.tsx
├── user-management-widget.test.tsx
├── system-monitoring-widget.test.tsx
└── matching-status-widget.test.tsx
```

### 테스트 현황

| 위젯 | 테스트 파일 | 상태 | 테스트 케이스 |
|------|-----------|------|-------------|
| SystemStats | system-stats-widget.test.tsx | ✅ | 6개 |
| UserManagement | user-management-widget.test.tsx | ✅ | 6개 |
| SystemMonitoring | system-monitoring-widget.test.tsx | ✅ | 5개 |
| MatchingStatus | matching-status-widget.test.tsx | ✅ | 5개 |
| **합계** | 4개 파일 | ✅ **22개** | **100%** |

### 구현 통계

| 항목 | 수량 |
|------|------|
| 위젯 컴포넌트 | 4개 |
| 데이터 인터페이스 | 4개 |
| Props 인터페이스 | 4개 |
| 테스트 파일 | 4개 |
| 테스트 케이스 | 22개 |
| 차트 타입 | 3개 (BarChart, LineChart, PieChart) |

---

## TAG 체인 검증

### Primary Chain (SPEC → TEST → CODE)

```
@SPEC:DASHBOARD-001 (v0.2.0)
└─ .moai/specs/SPEC-DASHBOARD-001/spec.md
   ├─ @TEST:DASHBOARD-001
   │  └─ tests/features/dashboard/widgets/admin/ (4개 테스트 파일, 22개 테스트)
   └─ @CODE:DASHBOARD-001:ADMIN-WIDGETS
      └─ src/features/dashboard/widgets/admin/ (4개 위젯)
```

### 무결성 검증

- ✅ SPEC 메타데이터: 필수 필드 7개 모두 포함
- ✅ SPEC 버전: v0.2.0 (Phase 4-5 완료)
- ✅ TEST TAG: 4개 파일, 22개 테스트, 100% 통과
- ✅ CODE TAG: 4개 위젯 구현
- ✅ 고아 TAG: 0개 (모든 TAG 참조됨)

---

## 기술 스택

### UI 컴포넌트
- **shadcn/ui**: Card, Badge, Button
- **Tailwind CSS**: 그리드, 레이아웃, 스타일링

### 차트 & 시각화
- **Recharts**: BarChart, LineChart, PieChart
- **Lucide React**: 아이콘 (Users, FileText, GitMerge, MessageSquare)

### 테스트
- **Vitest**: 단위 테스트 프레임워크
- **React Testing Library**: 컴포넌트 테스트

---

## 성능 특성

### 렌더링 시간
- **목표**: 1초 이내
- **기술**: useMemo로 차트 데이터 메모이제이션

### 메모리 사용량
- **목표**: 각 위젯 10MB 이하
- **최적화**: 불필요한 재렌더링 방지

### 데이터 크기
- **SystemStatsWidget**: ~100 bytes
- **UserManagementWidget**: ~500 bytes (차트 데이터 포함)
- **SystemMonitoringWidget**: ~1KB (추이 데이터 포함)
- **MatchingStatusWidget**: ~300 bytes

---

## 다음 단계 (Phase 5)

- [ ] 통합 페이지 구현 (src/app/dashboard/admin/page.tsx)
- [ ] 데이터 페칭 서비스 (dashboardService.ts)
- [ ] React Query 통합 (useDashboardData hook)
- [ ] 실시간 갱신 기능
- [ ] E2E 테스트

---

## 문서 유지 보수

### 마지막 업데이트
- **날짜**: 2025-10-21
- **작성자**: @Alfred
- **버전**: Phase 4
- **상태**: completed

### 검토 체크리스트

- ✅ 모든 위젯 구현 완료
- ✅ 22/22 테스트 통과
- ✅ @TAG 시스템 검증 완료
- ✅ Living Document 작성 완료
- ⏳ Phase 5 준비 (데이터 페칭 서비스)

---

**이 문서는 Living Document입니다. 코드 변경 시 함께 업데이트됩니다.**
**관련 SPEC**: `.moai/specs/SPEC-DASHBOARD-001/spec.md`
**추적성**: TAG 체인 완전성 100% (@SPEC:DASHBOARD-001 → @TEST:DASHBOARD-001 → @CODE:DASHBOARD-001:ADMIN-WIDGETS)
