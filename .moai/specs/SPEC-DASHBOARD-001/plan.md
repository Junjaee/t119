# SPEC-DASHBOARD-001 구현 계획서

## 개요

역할별 대시보드 구현을 위한 단계별 계획입니다. React Query, Supabase Realtime, Recharts를 활용하여 빠르고 직관적인 대시보드를 구축합니다.

---

## 마일스톤

### 1차 목표: 기본 대시보드 레이아웃 (Critical)

**범위**:
- 역할별 라우팅 (교사/변호사/관리자)
- 스켈레톤 UI 구현
- 기본 위젯 컴포넌트 구조
- 반응형 레이아웃 (Grid)

**산출물**:
- `DashboardLayout.tsx`: 공통 레이아웃
- `TeacherDashboard.tsx`: 교사 대시보드
- `LawyerDashboard.tsx`: 변호사 대시보드
- `AdminDashboard.tsx`: 관리자 대시보드
- `WidgetCard.tsx`: 위젯 카드 컴포넌트
- `SkeletonWidget.tsx`: 스켈레톤 UI

**검증 기준**:
- 역할별 대시보드 정상 렌더링
- 반응형 레이아웃 (데스크톱/태블릿/모바일)
- 스켈레톤 UI 표시

**의존성**:
- AUTH-001 (역할 기반 라우팅)

---

### 2차 목표: 데이터 페칭 및 표시 (Critical)

**범위**:
- React Query 설정
- Supabase 쿼리 함수
- 위젯별 데이터 표시
- 에러 처리

**산출물**:
- `dashboard-queries.ts`: React Query hooks
- `dashboard-service.ts`: Supabase 쿼리 로직
- `ReportWidget.tsx`: 신고 현황 위젯
- `ConsultationWidget.tsx`: 상담 이력 위젯
- `StatsWidget.tsx`: 통계 위젯
- `ErrorBoundary.tsx`: 에러 경계

**검증 기준**:
- 모든 위젯 데이터 정상 표시
- 병렬 페칭으로 2초 이내 로딩
- 에러 발생 시 재시도 버튼 표시

**의존성**:
- REPORT-001 (신고 데이터)
- MATCH-001 (매칭 데이터)

---

### 3차 목표: 차트 및 시각화 (High)

**범위**:
- Recharts 통합
- 월별 통계 차트
- 평가 점수 차트
- 인터랙션 (호버, 클릭)

**산출물**:
- `LineChart.tsx`: 선 그래프 컴포넌트
- `BarChart.tsx`: 막대 그래프 컴포넌트
- `PieChart.tsx`: 원 그래프 컴포넌트
- `chart-utils.ts`: 데이터 변환 유틸리티

**검증 기준**:
- 차트 렌더링 1초 이내
- 호버 시 툴팁 표시
- 클릭 시 상세 페이지 이동

---

### 4차 목표: 실시간 업데이트 (High)

**범위**:
- Supabase Realtime 구독
- 데이터 자동 갱신
- Optimistic Update
- 애니메이션 효과

**산출물**:
- `realtime-service.ts`: Realtime 구독 로직
- `useRealtimeUpdates.ts`: 실시간 업데이트 hook
- `AnimatedWidget.tsx`: 애니메이션 위젯 래퍼

**검증 기준**:
- 새 데이터 발생 시 3초 이내 반영
- UI 부드러운 전환 (애니메이션)
- 구독 해제 시 메모리 누수 없음

---

### 5차 목표: 성능 최적화 (Medium)

**범위**:
- React Query 캐싱 전략
- 차트 메모이제이션
- Virtual Scrolling (목록 위젯)
- 코드 스플리팅

**산출물**:
- `query-config.ts`: React Query 설정
- `VirtualList.tsx`: Virtual Scrolling 목록
- 역할별 대시보드 lazy loading

**검증 기준**:
- 초기 로딩 2초 이내
- 메모리 사용량 100MB 이하
- 차트 렌더링 1초 이내

---

### 6차 목표: 필터링 및 커스터마이징 (Low)

**범위**:
- 기간 필터 (주간/월간/연간)
- 위젯 배치 커스터마이징 (선택)
- CSV 내보내기 (선택)

**산출물**:
- `FilterBar.tsx`: 필터 UI
- `DateRangePicker.tsx`: 날짜 선택
- `export-csv.ts`: CSV 내보내기 함수

**검증 기준**:
- 필터 변경 시 1초 이내 데이터 갱신
- CSV 내보내기 정상 동작

---

## 기술적 접근 방법

### 1. React Query 병렬 페칭

**구현 방법**:
```typescript
export function useTeacherDashboard(userId: string) {
  const reports = useQuery({
    queryKey: ['teacher-reports', userId],
    queryFn: () => fetchTeacherReports(userId),
  });

  const consultations = useQuery({
    queryKey: ['teacher-consultations', userId],
    queryFn: () => fetchTeacherConsultations(userId),
  });

  const stats = useQuery({
    queryKey: ['teacher-stats', userId],
    queryFn: () => fetchTeacherStats(userId),
  });

  return {
    reports,
    consultations,
    stats,
    isLoading: reports.isLoading || consultations.isLoading || stats.isLoading,
  };
}
```

### 2. Supabase Realtime 구독

**구현 방법**:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('dashboard-updates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'reports',
      filter: `teacher_id=eq.${userId}`,
    }, (payload) => {
      queryClient.invalidateQueries(['teacher-reports', userId]);
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [userId, queryClient]);
```

### 3. 스켈레톤 UI 구현

**구현 방법**:
```typescript
export function SkeletonWidget() {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-16 w-full mb-2" />
      <Skeleton className="h-4 w-24" />
    </Card>
  );
}
```

### 4. 차트 데이터 변환

**구현 방법**:
```typescript
export function transformToChartData(rawData: Report[]) {
  const grouped = rawData.reduce((acc, report) => {
    const month = format(new Date(report.created_at), 'yyyy-MM');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([month, count]) => ({
    month,
    count,
  }));
}
```

---

## 아키텍처 설계

### 디렉토리 구조
```
src/features/dashboard/
├── components/
│   ├── DashboardLayout.tsx
│   ├── TeacherDashboard.tsx
│   ├── LawyerDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── widgets/
│   │   ├── ReportWidget.tsx
│   │   ├── ConsultationWidget.tsx
│   │   ├── StatsWidget.tsx
│   │   └── MatchWidget.tsx
│   └── charts/
│       ├── LineChart.tsx
│       ├── BarChart.tsx
│       └── PieChart.tsx
├── hooks/
│   ├── useTeacherDashboard.ts
│   ├── useLawyerDashboard.ts
│   ├── useAdminDashboard.ts
│   └── useRealtimeUpdates.ts
├── services/
│   ├── dashboard-queries.ts
│   ├── dashboard-service.ts
│   └── realtime-service.ts
├── utils/
│   ├── chart-utils.ts
│   └── export-csv.ts
└── types/
    └── dashboard.types.ts
```

### 컴포넌트 계층 구조
```
App
└── DashboardLayout
    ├── TeacherDashboard
    │   ├── ReportWidget
    │   ├── ConsultationWidget
    │   └── StatsWidget (LineChart)
    ├── LawyerDashboard
    │   ├── MatchWidget
    │   ├── ConsultationWidget
    │   └── RatingWidget (BarChart)
    └── AdminDashboard
        ├── SystemStatsWidget
        ├── UserManagementWidget
        └── MatchingWidget (PieChart)
```

---

## 리스크 및 대응 방안

### 1. 초기 로딩 시간 초과 (>2초)
**리스크**: 위젯 개수가 많아 데이터 페칭 지연
**대응**:
- React Query 병렬 페칭 활용
- 스켈레톤 UI로 체감 속도 개선
- 중요도 낮은 위젯은 lazy loading

### 2. 실시간 업데이트 부하
**리스크**: Realtime 구독으로 메모리 누수
**대응**:
- 컴포넌트 언마운트 시 구독 해제
- useEffect cleanup 함수 활용
- React Query 캐시 타임 설정

### 3. 차트 렌더링 성능
**리스크**: 데이터 많을 때 차트 렌더링 지연
**대응**:
- 차트 데이터 메모이제이션
- 샘플링 (1000개 이상 시 간격 조정)
- 가상화 (Virtual Scrolling)

### 4. 권한 우회 시도
**리스크**: URL 직접 접근으로 다른 역할 대시보드 조회
**대응**:
- JWT 토큰 역할 검증 (클라이언트)
- Supabase RLS 정책 (서버)
- 권한 없음 시 403 에러 + 리디렉션

---

## 성능 최적화 전략

### 1. React Query 설정
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분 동안 fresh
      cacheTime: 10 * 60 * 1000, // 10분 동안 캐시 유지
      refetchOnWindowFocus: false, // 윈도우 포커스 시 리페치 안함
    },
  },
});
```

### 2. 코드 스플리팅
```typescript
const TeacherDashboard = lazy(() => import('./TeacherDashboard'));
const LawyerDashboard = lazy(() => import('./LawyerDashboard'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
```

### 3. 이미지 최적화
```typescript
<Image
  src={avatarUrl}
  alt="User Avatar"
  width={40}
  height={40}
  loading="lazy"
/>
```

### 4. Virtual Scrolling (목록 위젯)
```typescript
const rowVirtualizer = useVirtualizer({
  count: reports.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

---

## 보안 체크리스트

- [ ] JWT 토큰 역할 검증 (클라이언트)
- [ ] Supabase RLS 정책 적용 (서버)
- [ ] 민감 정보 마스킹 (관리자 대시보드)
- [ ] XSS 방지 (차트 데이터 검증)
- [ ] CSRF 방지 (Supabase 기본 제공)
- [ ] Rate Limiting (API 호출 제한)

---

## 접근성 체크리스트

- [ ] 키보드 네비게이션 지원
- [ ] ARIA 레이블 (위젯, 차트)
- [ ] 색상 대비 비율 4.5:1 이상
- [ ] 스크린 리더 호환
- [ ] 포커스 표시 (outline)
- [ ] 다크모드 지원

---

## 의존성 관리

### NPM 패키지
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.0",
    "recharts": "^2.10.3",
    "@tanstack/react-virtual": "^3.0.1",
    "date-fns": "^3.0.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2"
  }
}
```

### Supabase 테이블 의존성
- `reports` 테이블 (REPORT-001)
- `matches` 테이블 (MATCH-001)
- `consultations` 테이블 (CONSULT-001)
- `users` 테이블 (AUTH-001)

---

## 테스트 계획

### 단위 테스트
- 데이터 변환 함수 (`transformToChartData`)
- 필터링/정렬 로직
- 권한 검증 함수

### 통합 테스트
- React Query 페칭 동작
- Realtime 구독/해제
- 에러 핸들링

### E2E 테스트
- 역할별 대시보드 렌더링
- 실시간 데이터 업데이트
- 필터링 동작

---

## 다음 단계

1. **데이터베이스 쿼리 최적화**: 인덱스 생성, 쿼리 튜닝
2. **TDD 구현**: `/alfred:2-build DASHBOARD-001` 실행
3. **성능 테스트**: Lighthouse, Bundle Analyzer
4. **문서 동기화**: `/alfred:3-sync` 실행

---

**문서 버전**: v0.0.1
**최종 수정일**: 2025-10-20
**작성자**: @Goos
