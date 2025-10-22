// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// TeacherDashboard 페이지 테스트

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TeacherDashboard from '@/app/dashboard/teacher/page';

// Mock useAuth Hook
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'teacher-1', role: 'teacher' },
    isLoading: false,
  })),
}));

// Mock dashboard service
vi.mock('@/features/dashboard/services/dashboardService', () => ({
  fetchTeacherDashboardData: vi.fn(() =>
    Promise.resolve({
      reports: { pending: 3, completed: 10, recent: [] },
      consultations: { active: 2, total: 8, nextScheduled: null },
      stats: { totalReports: 13, avgProcessingTime: 5.2, avgRating: 4.5 },
    })
  ),
}));

describe('TeacherDashboard Page', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('인증되지 않은 사용자 리디렉션', async () => {
    const { useAuth } = await import('@/features/auth/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: null,
      isLoading: false,
    } as any);

    render(<TeacherDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText(/로그인이 필요합니다/i)).toBeInTheDocument();
  });

  it('4개 위젯 렌더링', async () => {
    render(<TeacherDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('report-stats-widget')).toBeInTheDocument();
      expect(screen.getByTestId('consultation-widget')).toBeInTheDocument();
      expect(screen.getByTestId('personal-stats-widget')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions-widget')).toBeInTheDocument();
    });
  });

  it('로딩 스켈레톤 표시', () => {
    const { useAuth } = require('@/features/auth/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: { id: 'teacher-1', role: 'teacher' },
      isLoading: true,
    } as any);

    render(<TeacherDashboard />, { wrapper: createWrapper() });

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('2열 그리드 레이아웃', async () => {
    render(<TeacherDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      const grid = screen.getByTestId('dashboard-grid');
      expect(grid).toHaveClass('grid-cols-2');
    });
  });

  it('자동 갱신 설정 (5분)', async () => {
    const { useDashboardData } = await import(
      '@/features/dashboard/hooks/useDashboardData'
    );

    render(<TeacherDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(useDashboardData).toHaveBeenCalledWith(
        'teacher',
        'teacher-1',
        expect.objectContaining({
          refetchInterval: 5 * 60 * 1000,
        })
      );
    });
  });
});
