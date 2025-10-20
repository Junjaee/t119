// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// 변호사 대시보드 테스트

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LawyerDashboard } from '@/features/dashboard/lawyer-dashboard';
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

describe('@TEST:DASHBOARD-001 - 변호사 대시보드', () => {
  const mockUserId = 'lawyer-001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('위젯 렌더링', () => {
    it('배정 사건 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<LawyerDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-assigned-cases')).toBeInTheDocument();
      });
    });

    it('진행 중 상담 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<LawyerDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-active-consultations')).toBeInTheDocument();
      });
    });

    it('평가 점수 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<LawyerDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-rating')).toBeInTheDocument();
      });
    });

    it('실적 통계 위젯을 표시해야 한다', async () => {
      renderWithQueryClient(<LawyerDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('widget-performance')).toBeInTheDocument();
      });
    });
  });

  describe('차트 렌더링', () => {
    it('월별 처리 건수 차트를 1초 이내에 렌더링해야 한다', async () => {
      const startTime = Date.now();
      renderWithQueryClient(<LawyerDashboard userId={mockUserId} />);

      await waitFor(
        () => {
          expect(screen.getByTestId('chart-monthly-cases')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('평가 추이 차트를 표시해야 한다', async () => {
      renderWithQueryClient(<LawyerDashboard userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-rating-trend')).toBeInTheDocument();
      });
    });
  });
});
