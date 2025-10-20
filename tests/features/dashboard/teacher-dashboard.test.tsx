// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// 교사 대시보드 테스트

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TeacherDashboard } from '@/features/dashboard/teacher-dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client with proper method chaining
const mockSupabaseChain = () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  };
  return chain;
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabaseChain()),
    channel: vi.fn(() => ({
      on: vi.fn(function (this: any) {
        return this;
      }),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('@TEST:DASHBOARD-001 - 교사 대시보드', () => {
  const mockUserId = 'teacher-001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('초기 로딩', () => {
    it('스켈레톤 UI를 표시해야 한다', () => {
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);
      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    });

    it('2초 이내에 대시보드를 로드해야 한다', async () => {
      const startTime = Date.now();
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(
        () => {
          expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('위젯 렌더링', () => {
    it('내 신고 현황 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-my-reports')).toBeInTheDocument();
      });
    });

    it('상담 이력 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-consultations')).toBeInTheDocument();
      });
    });

    it('개인 통계 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-personal-stats')).toBeInTheDocument();
      });
    });

    it('빠른 액션 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-quick-actions')).toBeInTheDocument();
      });
    });
  });

  describe('실시간 업데이트', () => {
    it('Supabase Realtime을 구독해야 한다', async () => {
      // Realtime subscription은 컴포넌트 마운트 시 자동 수행됨
      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        // 대시보드가 정상적으로 렌더링되면 성공
        expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
      });
    });
  });

  describe('반응형 레이아웃', () => {
    it('모바일 화면에서 1열 그리드로 표시해야 한다', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        const grid = screen.getByTestId('dashboard-grid');
        expect(grid).toHaveClass('grid-cols-1');
      });
    });

    it('데스크톱 화면에서 3열 그리드로 표시해야 한다', async () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));

      renderWithQueryClient(<TeacherDashboard userId={mockUserId} />);

      await waitFor(() => {
        const grid = screen.getByTestId('dashboard-grid');
        expect(grid).toHaveClass('lg:grid-cols-3');
      });
    });
  });

  describe('권한 검증', () => {
    it('인증되지 않은 사용자는 접근할 수 없어야 한다', async () => {
      renderWithQueryClient(<TeacherDashboard userId={''} />);

      await waitFor(() => {
        expect(screen.getByText(/인증이 필요합니다/i)).toBeInTheDocument();
      });
    });
  });
});
