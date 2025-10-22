// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// AdminDashboard 페이지 테스트

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from '@/app/dashboard/admin/page';

// Mock useAuth Hook
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-1', role: 'admin' },
    isLoading: false,
  })),
}));

// Mock dashboard service
vi.mock('@/features/dashboard/services/dashboardService', () => ({
  fetchAdminDashboardData: vi.fn(() =>
    Promise.resolve({
      systemStats: { totalUsers: 150, totalReports: 320, totalMatches: 280 },
      userManagement: { newUsers: 12, activeUsers: 85 },
      systemMonitoring: { avgResponseTime: 250, errorCount: 3 },
      matchingStatus: { pendingMatches: 8, avgMatchTime: 3.5, successRate: 92 },
    })
  ),
}));

describe('AdminDashboard Page', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('관리자 권한 확인', async () => {
    const { useAuth } = await import('@/features/auth/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: { id: 'user-1', role: 'teacher' },
      isLoading: false,
    } as any);

    render(<AdminDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/관리자 권한이 필요합니다/i)).toBeInTheDocument();
  });

  it('4개 위젯 렌더링', async () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('system-stats-widget')).toBeInTheDocument();
      expect(screen.getByTestId('user-management-widget')).toBeInTheDocument();
      expect(screen.getByTestId('system-monitoring-widget')).toBeInTheDocument();
      expect(screen.getByTestId('matching-status-widget')).toBeInTheDocument();
    });
  });

  it('로딩 스켈레톤 표시', () => {
    const { useAuth } = require('@/features/auth/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: { id: 'admin-1', role: 'admin' },
      isLoading: true,
    } as any);

    render(<AdminDashboard />, { wrapper: createWrapper() });

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('2열 그리드 레이아웃', async () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      const grid = screen.getByTestId('dashboard-grid');
      expect(grid).toHaveClass('grid-cols-2');
    });
  });

  it('자동 갱신 설정 (5분)', async () => {
    const { useDashboardData } = await import(
      '@/features/dashboard/hooks/useDashboardData'
    );

    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(useDashboardData).toHaveBeenCalledWith(
        'admin',
        'admin-1',
        expect.objectContaining({
          refetchInterval: 5 * 60 * 1000,
        })
      );
    });
  });
});
