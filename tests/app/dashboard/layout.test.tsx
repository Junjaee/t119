// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// DashboardLayout 테스트

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from '@/app/dashboard/layout';

// Mock useAuth Hook
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', role: 'teacher' },
    isLoading: false,
  })),
}));

describe('DashboardLayout', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('헤더 렌더링', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByText('대시보드')).toBeInTheDocument();
  });

  it('사이드바 렌더링', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
  });

  it('새로고침 버튼 클릭', () => {
    const mockRefresh = vi.fn();
    vi.spyOn(window.location, 'reload').mockImplementation(mockRefresh);

    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
      { wrapper: createWrapper() }
    );

    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('마지막 업데이트 시간 표시', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('last-updated')).toBeInTheDocument();
  });

  it('인증되지 않은 사용자 차단', () => {
    const { useAuth } = require('@/features/auth/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: null,
      isLoading: false,
    } as any);

    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/로그인이 필요합니다/i)).toBeInTheDocument();
  });

  it('역할별 네비게이션 메뉴', () => {
    const { useAuth } = require('@/features/auth/hooks/useAuth');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: { id: 'user-1', role: 'teacher' },
      isLoading: false,
    } as any);

    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('내 신고')).toBeInTheDocument();
    expect(screen.getByText('상담 이력')).toBeInTheDocument();
  });
});
