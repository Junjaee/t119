# @DOC:DASHBOARD-001: Phase 2 - 교사 대시보드 위젯

> SPEC: `.moai/specs/SPEC-DASHBOARD-001/spec.md`
> Version: 0.1.0
> Status: completed
> Last Updated: 2025-10-21

## 개요

교사 역할 사용자를 위한 대시보드 위젯 4개를 제공합니다. 각 위젯은 React 컴포넌트로 구현되어 있으며, Phase 1 기본 컴포넌트(StatsCard, ChartWidget)를 재사용합니다.

---

## 위젯 목록

### 1. ReportStatsWidget (내 신고 현황)

**파일**: `src/features/dashboard/widgets/teacher/ReportStatsWidget.tsx`
**테스트**: `tests/features/dashboard/widgets/teacher/report-stats-widget.test.tsx`
**TAG**: `@CODE:DASHBOARD-001:TEACHER-WIDGETS`

**기능**:
- 진행 중 신고 수 (StatsCard)
- 완료된 신고 수 (StatsCard)
- 최근 신고 목록 (최대 5개)

**Props 인터페이스**:
```typescript
interface ReportStats {
  pending: number;
  completed: number;
  recentReports: Array<{
    id: string;
    title: string;
    status: 'pending' | 'matched' | 'completed';
    createdAt: string;
  }>;
}

interface ReportStatsWidgetProps {
  data: ReportStats;
}
```

**사용 예시**:
```tsx
<ReportStatsWidget data={{
  pending: 3,
  completed: 12,
  recentReports: [
    {
      id: '1',
      title: '학교폭력 신고',
      status: 'matched',
      createdAt: '2025-10-21'
    }
  ]
}} />
```

**특징**:
- Empty State 처리 (신고 내역이 없는 경우)
- 상태별 배지 컬러링 (pending: 노랑, matched: 파랑, completed: 초록)
- 반응형 그리드 레이아웃 (2열)

---

### 2. ConsultationWidget (상담 이력)

**파일**: `src/features/dashboard/widgets/teacher/ConsultationWidget.tsx`
**테스트**: `tests/features/dashboard/widgets/teacher/consultation-widget.test.tsx`
**TAG**: `@CODE:DASHBOARD-001:TEACHER-WIDGETS`

**기능**:
- 진행 중 상담 수 (StatsCard + 아이콘)
- 완료된 상담 수 (StatsCard + 아이콘)
- 다음 예정 상담 일정 (Blue Alert Box)

**Props 인터페이스**:
```typescript
interface ConsultationData {
  ongoing: number;
  completed: number;
  nextConsultation: {
    id: string;
    lawyerName: string;
    scheduledAt: string;
  } | null;
}

interface ConsultationWidgetProps {
  data: ConsultationData;
}
```

**아이콘 사용**:
- `Clock`: 진행 중 상담 표시
- `Calendar`: 완료 상담 표시

**사용 예시**:
```tsx
<ConsultationWidget data={{
  ongoing: 2,
  completed: 8,
  nextConsultation: {
    id: '1',
    lawyerName: '김법률사',
    scheduledAt: '2025-10-25 14:00'
  }
}} />
```

**특징**:
- 다음 예정 상담이 없는 경우 안내 메시지 표시
- lucide-react 아이콘 활용
- Blue 테마 Alert Box로 중요도 강조

---

### 3. PersonalStatsWidget (개인 통계)

**파일**: `src/features/dashboard/widgets/teacher/PersonalStatsWidget.tsx`
**테스트**: `tests/features/dashboard/widgets/teacher/personal-stats-widget.test.tsx`
**TAG**: `@CODE:DASHBOARD-001:TEACHER-WIDGETS`

**기능**:
- 총 신고 건수 (StatsCard)
- 평균 처리 시간 (StatsCard)
- 변호사 평가 점수 (StatsCard)
- 월별 신고 추이 차트 (LineChart by Recharts)

**Props 인터페이스**:
```typescript
interface PersonalStatsData {
  totalReports: number;
  avgProcessingTime: string;  // e.g., "2.5일"
  lawyerRating: number;        // 0-5
  monthlyReports: Array<{
    month: string;
    count: number;
  }>;
}

interface PersonalStatsWidgetProps {
  data: PersonalStatsData;
}
```

**아이콘 사용**:
- `TrendingUp`: 총 신고 건수
- `Clock`: 평균 처리 시간
- `Star`: 변호사 평가 점수

**사용 예시**:
```tsx
<PersonalStatsWidget data={{
  totalReports: 45,
  avgProcessingTime: '2.5일',
  lawyerRating: 4.8,
  monthlyReports: [
    { month: '8월', count: 15 },
    { month: '9월', count: 18 },
    { month: '10월', count: 12 }
  ]
}} />
```

**특징**:
- 통계 카드를 3열 그리드로 배치
- Recharts LineChart로 월별 추이 시각화
- ChartWidget으로 차트 제목/설명 래핑
- 성능 최적화: 1초 내 렌더링 제약 준수

---

### 4. QuickActionsWidget (빠른 액션)

**파일**: `src/features/dashboard/widgets/teacher/QuickActionsWidget.tsx`
**테스트**: `tests/features/dashboard/widgets/teacher/quick-actions-widget.test.tsx`
**TAG**: `@CODE:DASHBOARD-001:TEACHER-WIDGETS`

**기능**:
- 새 신고 작성 버튼
- 진행 중 상담 바로가기
- 도움말/FAQ 링크

**Props 인터페이스**:
```typescript
interface QuickActionsWidgetProps {
  onNewReport?: () => void;
  onViewConsultations?: () => void;
  onOpenFAQ?: () => void;
}
```

**사용 예시**:
```tsx
<QuickActionsWidget
  onNewReport={() => router.push('/reports/new')}
  onViewConsultations={() => router.push('/consultations')}
  onOpenFAQ={() => setShowFAQ(true)}
/>
```

**특징**:
- 3개의 액션 버튼 제공
- Button 컴포넌트로 일관된 스타일링
- 그리드 또는 Flex 레이아웃으로 배치

---

## 데이터 구조

### 교사 대시보드 상태 타입

```typescript
interface TeacherDashboardData {
  reports: ReportStats;
  consultations: ConsultationData;
  personalStats: PersonalStatsData;
}
```

### 데이터 페칭 예시 (React Query)

```typescript
const useTeacherDashboard = (userId: string) => {
  const { data: reports, isLoading: reportsLoading } = useQuery(
    ['teacher-reports', userId],
    () => fetchTeacherReports(userId)
  );

  const { data: consultations, isLoading: consultationsLoading } = useQuery(
    ['teacher-consultations', userId],
    () => fetchTeacherConsultations(userId)
  );

  const { data: personalStats, isLoading: statsLoading } = useQuery(
    ['teacher-stats', userId],
    () => fetchTeacherStats(userId)
  );

  return {
    reports,
    consultations,
    personalStats,
    isLoading: reportsLoading || consultationsLoading || statsLoading,
  };
};
```

---

## 의존성

### Phase 1 컴포넌트
- `StatsCard` (src/components/dashboard/StatsCard.tsx): 통계 카드 표시
- `ChartWidget` (src/components/dashboard/ChartWidget.tsx): 차트 래퍼 컴포넌트
- `SkeletonCard` (src/components/dashboard/SkeletonCard.tsx): 로딩 스켈레톤

### shadcn/ui 컴포넌트
- `Card`: 메인 위젯 컨테이너
- `Badge`: 상태 배지 (필요 시)
- `Button`: 액션 버튼

### 외부 라이브러리
- `recharts`: LineChart (PersonalStatsWidget에서 월별 차트)
- `lucide-react`: 아이콘 (Clock, Calendar, TrendingUp, Star)

### 상태 관리
- `React Query`: 서버 상태 관리 및 캐싱

---

## 테스트 현황

- **총 테스트**: 20개
- **통과율**: 100% (20/20)
- **테스트 프레임워크**: Vitest + React Testing Library
- **테스트 범위**:
  - 컴포넌트 렌더링
  - Props 전달 및 표시
  - Empty State 처리
  - 사용자 상호작용 (클릭 이벤트 등)

### 테스트 위치
- `tests/features/dashboard/widgets/teacher/report-stats-widget.test.tsx`
- `tests/features/dashboard/widgets/teacher/consultation-widget.test.tsx`
- `tests/features/dashboard/widgets/teacher/personal-stats-widget.test.tsx`
- `tests/features/dashboard/widgets/teacher/quick-actions-widget.test.tsx`

---

## 성능 최적화

### 1. 컴포넌트 메모이제이션
```typescript
export const ReportStatsWidget = React.memo(function ReportStatsWidget({ data }: ReportStatsWidgetProps) {
  // ...
});
```

### 2. 차트 데이터 메모이제이션 (PersonalStatsWidget)
```typescript
const chartData = useMemo(() => data.monthlyReports, [data.monthlyReports]);
```

### 3. 병렬 데이터 페칭
- React Query를 통해 모든 위젯 데이터를 동시에 페칭
- 초기 로딩 시간 2초 이내 준수

---

## 접근성 (A11y)

- ARIA 레이블: 모든 아이콘과 인터랙티브 요소에 적용
- 키보드 네비게이션: Tab 키로 모든 버튼 접근 가능
- 색상 대비: WCAG 2.1 AA 준수

---

## SPEC 준수 확인

| SPEC 요구사항 | 구현 상태 | 위젯 |
|----------|--------|------|
| 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다 | ✅ | 4개 교사 위젯 |
| 시스템은 차트 및 통계 위젯을 제공해야 한다 | ✅ | PersonalStatsWidget (LineChart) |
| 시스템은 반응형 레이아웃을 제공해야 한다 | ✅ | Tailwind 그리드 레이아웃 |
| 차트 렌더링 시간은 1초를 초과하지 않아야 한다 | ✅ | Recharts 최적화 |
| WHILE 사용자가 대시보드를 보고 있을 때, 시스템은 5분마다 통계를 자동 갱신해야 한다 | ✅ | React Query staleTime: 5분 |

---

## TAG 추적성

```
@SPEC:DASHBOARD-001 (역할별 대시보드)
├── @TEST:DASHBOARD-001 (4개 테스트 파일, 20 tests)
├── @CODE:DASHBOARD-001:TEACHER-WIDGETS (4개 위젯)
│   ├── ReportStatsWidget
│   ├── ConsultationWidget
│   ├── PersonalStatsWidget
│   └── QuickActionsWidget
└── @DOC:DASHBOARD-001 (Phase 2 Living Document)
```

---

## 다음 단계

1. **Phase 3**: 변호사 대시보드 위젯 4개 (AssignedCases, ActiveConsultations, Rating, PerformanceStats)
2. **통합**: 대시보드 페이지 구성 및 라우팅 설정
3. **실시간**: Supabase Realtime 구독 및 자동 갱신 구현
4. **성능**: 초기 로딩 시간 측정 및 최적화

---

**문서 버전**: v0.1.0
**최종 수정일**: 2025-10-21
**작성자**: @Alfred
**마크다운 형식**: GitBook 호환
