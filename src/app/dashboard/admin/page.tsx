// @CODE:DASHBOARD-001:DASHBOARD-PAGES | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/app/dashboard/admin/page.test.tsx
// 관리자 대시보드 페이지

'use client';

import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { SystemStatsWidget } from '@/features/dashboard/widgets/admin/SystemStatsWidget';
import { UserManagementWidget } from '@/features/dashboard/widgets/admin/UserManagementWidget';
import { SystemMonitoringWidget } from '@/features/dashboard/widgets/admin/SystemMonitoringWidget';
import { MatchingStatusWidget } from '@/features/dashboard/widgets/admin/MatchingStatusWidget';

/**
 * 관리자 대시보드 페이지
 * @TEST:DASHBOARD-001 - 4개 위젯, 2열 그리드, 관리자 권한 확인, 5분 자동 갱신
 */
export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useDashboardData(
    'admin',
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

  // 관리자 권한 확인
  if (user.role !== 'admin') {
    return (
      <div className="p-4">
        <p className="text-red-600">관리자 권한이 필요합니다</p>
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
      aria-label="관리자 대시보드 위젯"
    >
      {/* 위젯 1: 전체 통계 */}
      <div data-testid="system-stats-widget" role="article" aria-label="전체 통계">
        <SystemStatsWidget
          totalUsers={data?.systemStats.totalUsers || 0}
          totalReports={data?.systemStats.totalReports || 0}
          totalMatches={data?.systemStats.totalMatches || 0}
        />
      </div>

      {/* 위젯 2: 사용자 관리 */}
      <div data-testid="user-management-widget" role="article" aria-label="사용자 관리">
        <UserManagementWidget
          newUsers={data?.userManagement.newUsers || 0}
          activeUsers={data?.userManagement.activeUsers || 0}
        />
      </div>

      {/* 위젯 3: 시스템 모니터링 */}
      <div data-testid="system-monitoring-widget" role="article" aria-label="시스템 모니터링">
        <SystemMonitoringWidget
          avgResponseTime={data?.systemMonitoring.avgResponseTime || 0}
          errorCount={data?.systemMonitoring.errorCount || 0}
        />
      </div>

      {/* 위젯 4: 매칭 현황 */}
      <div data-testid="matching-status-widget" role="article" aria-label="매칭 현황">
        <MatchingStatusWidget
          pendingMatches={data?.matchingStatus.pendingMatches || 0}
          avgMatchTime={data?.matchingStatus.avgMatchTime || 0}
          successRate={data?.matchingStatus.successRate || 0}
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
