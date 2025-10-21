// @CODE:DASHBOARD-001:DASHBOARD-PAGES | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/app/dashboard/teacher/page.test.tsx
// 교사 대시보드 페이지

'use client';

import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { ReportStatsWidget } from '@/features/dashboard/widgets/teacher/ReportStatsWidget';
import { ConsultationWidget } from '@/features/dashboard/widgets/teacher/ConsultationWidget';
import { PersonalStatsWidget } from '@/features/dashboard/widgets/teacher/PersonalStatsWidget';
import { QuickActionsWidget } from '@/features/dashboard/widgets/teacher/QuickActionsWidget';

/**
 * 교사 대시보드 페이지
 * @TEST:DASHBOARD-001 - 4개 위젯, 2열 그리드, 5분 자동 갱신
 */
export default function TeacherDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useDashboardData(
    'teacher',
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
      aria-label="교사 대시보드 위젯"
    >
      {/* 위젯 1: 내 신고 현황 */}
      <div data-testid="report-stats-widget" role="article" aria-label="내 신고 현황">
        <ReportStatsWidget
          pending={data?.reports.pending || 0}
          completed={data?.reports.completed || 0}
          recent={data?.reports.recent || []}
        />
      </div>

      {/* 위젯 2: 상담 이력 */}
      <div data-testid="consultation-widget" role="article" aria-label="상담 이력">
        <ConsultationWidget
          active={data?.consultations.active || 0}
          total={data?.consultations.total || 0}
          nextScheduled={data?.consultations.nextScheduled}
        />
      </div>

      {/* 위젯 3: 개인 통계 */}
      <div data-testid="personal-stats-widget" role="article" aria-label="개인 통계">
        <PersonalStatsWidget
          totalReports={data?.stats.totalReports || 0}
          avgProcessingTime={data?.stats.avgProcessingTime || 0}
          avgRating={data?.stats.avgRating || 0}
        />
      </div>

      {/* 위젯 4: 빠른 액션 */}
      <div data-testid="quick-actions-widget" role="article" aria-label="빠른 액션">
        <QuickActionsWidget />
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
