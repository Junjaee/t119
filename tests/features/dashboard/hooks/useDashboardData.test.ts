// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// useDashboardData Hook 테스트

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import * as dashboardService from '@/features/dashboard/services/dashboardService';

vi.mock('@/features/dashboard/services/dashboardService');

describe('useDashboardData Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('교사 데이터 페칭', async () => {
    const mockData = {
      reports: { pending: 3, completed: 10, recent: [] },
      consultations: { active: 2, total: 8, nextScheduled: null },
      stats: { totalReports: 13, avgProcessingTime: 5.2, avgRating: 4.5 },
    };

    vi.mocked(dashboardService.fetchTeacherDashboardData).mockResolvedValue(
      mockData
    );

    const { result } = renderHook(
      () => useDashboardData('teacher', 'teacher-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('변호사 데이터 페칭', async () => {
    const mockData = {
      assignedCases: [],
      rating: { average: 4.5, count: 12 },
      performance: { monthlyCases: [], completionRate: 85 },
    };

    vi.mocked(dashboardService.fetchLawyerDashboardData).mockResolvedValue(
      mockData
    );

    const { result } = renderHook(
      () => useDashboardData('lawyer', 'lawyer-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('관리자 데이터 페칭', async () => {
    const mockData = {
      systemStats: { totalUsers: 150, totalReports: 320, totalMatches: 280 },
      userManagement: { newUsers: 12, activeUsers: 85 },
      systemMonitoring: { avgResponseTime: 250, errorCount: 3 },
      matchingStatus: { pendingMatches: 8, avgMatchTime: 3.5, successRate: 92 },
    };

    vi.mocked(dashboardService.fetchAdminDashboardData).mockResolvedValue(
      mockData
    );

    const { result } = renderHook(
      () => useDashboardData('admin', 'admin-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('5분 간격 자동 리페치', async () => {
    vi.useFakeTimers();

    const mockData = {
      reports: { pending: 3, completed: 10, recent: [] },
      consultations: { active: 2, total: 8, nextScheduled: null },
      stats: { totalReports: 13, avgProcessingTime: 5.2, avgRating: 4.5 },
    };

    vi.mocked(dashboardService.fetchTeacherDashboardData).mockResolvedValue(
      mockData
    );

    const { result } = renderHook(
      () => useDashboardData('teacher', 'teacher-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    const callCount = vi.mocked(dashboardService.fetchTeacherDashboardData).mock
      .calls.length;

    // 5분 경과
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(
        vi.mocked(dashboardService.fetchTeacherDashboardData).mock.calls.length
      ).toBeGreaterThan(callCount);
    });

    vi.useRealTimers();
  });

  it('에러 처리', async () => {
    vi.mocked(dashboardService.fetchTeacherDashboardData).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(
      () => useDashboardData('teacher', 'teacher-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('로딩 상태', () => {
    vi.mocked(dashboardService.fetchTeacherDashboardData).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(
      () => useDashboardData('teacher', 'teacher-1'),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
  });
});
