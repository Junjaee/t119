// @CODE:DASHBOARD-001:DASHBOARD-PAGES | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/app/dashboard/lawyer/page.test.tsx
// 변호사 대시보드 페이지

'use client';

import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { AssignedCasesWidget } from '@/features/dashboard/widgets/lawyer/AssignedCasesWidget';
import { ActiveConsultationsWidget } from '@/features/dashboard/widgets/lawyer/ActiveConsultationsWidget';
import { RatingWidget } from '@/features/dashboard/widgets/lawyer/RatingWidget';
import { PerformanceStatsWidget } from '@/features/dashboard/widgets/lawyer/PerformanceStatsWidget';

/**
 * 변호사 대시보드 페이지
 * @TEST:DASHBOARD-001 - 4개 위젯, 2열 그리드, 5분 자동 갱신
 */
export default function LawyerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useDashboardData(
    'lawyer',
    user?.id || '',
    {
      refetchInterval: 5 * 60 * 1000, // 5분
    }
  );

  // 인증 확인
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="p-4">
        <p>로그인이 필요합니다</p>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">데이터 로딩 중 오류가 발생했습니다</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          재시도
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="dashboard-grid"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
      role="region"
      aria-label="변호사 대시보드 위젯"
    >
      {/* 위젯 1: 배정 사건 */}
      <div data-testid="assigned-cases-widget" role="article" aria-label="배정 사건">
        <AssignedCasesWidget cases={data?.assignedCases || []} />
      </div>

      {/* 위젯 2: 진행 중 상담 */}
      <div data-testid="active-consultations-widget" role="article" aria-label="진행 중 상담">
        <ActiveConsultationsWidget />
      </div>

      {/* 위젯 3: 평가 점수 */}
      <div data-testid="rating-widget" role="article" aria-label="평가 점수">
        <RatingWidget
          average={data?.rating.average || 0}
          count={data?.rating.count || 0}
        />
      </div>

      {/* 위젯 4: 실적 통계 */}
      <div data-testid="performance-stats-widget" role="article" aria-label="실적 통계">
        <PerformanceStatsWidget
          monthlyCases={data?.performance.monthlyCases || []}
          completionRate={data?.performance.completionRate || 0}
        />
      </div>
    </div>
  );
}

/**
 * 스켈레톤 UI (로딩 상태)
 */
function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
