// @TEST:REPORT-FORM-001:F2 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md
// ReportForm 컴포넌트 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportForm from '@/components/reports/ReportForm';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// 테스트용 Wrapper 컴포넌트
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('@TEST:REPORT-FORM-001:F2 - ReportForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('폼 렌더링', () => {
    it('GIVEN 컴포넌트가 마운트되면 WHEN 폼이 로드되면 THEN 모든 필드가 표시되어야 한다', () => {
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      // 카테고리 선택
      expect(screen.getByLabelText(/학부모/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/학생/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/기타/i)).toBeInTheDocument();

      // 제목 입력
      expect(screen.getByLabelText(/제목/i)).toBeInTheDocument();

      // 설명 입력
      expect(screen.getByLabelText(/상세 설명/i)).toBeInTheDocument();

      // 사건 날짜
      expect(screen.getByLabelText(/사건 발생일/i)).toBeInTheDocument();

      // 우선순위 선택
      expect(screen.getByLabelText(/낮음/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/보통/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/높음/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/긴급/i)).toBeInTheDocument();

      // 제출 버튼
      expect(screen.getByRole('button', { name: /제출/i })).toBeInTheDocument();
    });

    it('GIVEN 초기 상태일 때 WHEN 페이지가 로드되면 THEN 제출 버튼이 비활성화되어야 한다', () => {
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /제출/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('필드 검증', () => {
    it('GIVEN 제목이 5자 미만이면 WHEN 입력하면 THEN 에러 메시지가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/제목/i);
      await user.type(titleInput, '짧음');
      await user.tab(); // blur 이벤트 트리거

      await waitFor(() => {
        expect(screen.getByText(/제목은 5자 이상이어야 합니다/i)).toBeInTheDocument();
      });
    });

    it('GIVEN 제목이 100자를 초과하면 WHEN 입력하면 THEN 에러 메시지가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/제목/i);
      const longTitle = 'a'.repeat(101);
      await user.type(titleInput, longTitle);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/제목은 100자 이하여야 합니다/i)).toBeInTheDocument();
      });
    });

    it('GIVEN 설명이 20자 미만이면 WHEN 입력하면 THEN 에러 메시지가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      const descriptionInput = screen.getByLabelText(/상세 설명/i);
      await user.type(descriptionInput, '짧은 설명');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/설명은 20자 이상이어야 합니다/i)).toBeInTheDocument();
      });
    });

    it('GIVEN 사건 날짜가 미래일 때 WHEN 선택하면 THEN 에러 메시지가 표시되어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      const dateInput = screen.getByLabelText(/사건 발생일/i);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await user.type(dateInput, futureDateStr);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/사건 날짜는 과거 또는 오늘이어야 합니다/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('폼 제출', () => {
    it('GIVEN 모든 필드가 유효한 값으로 채워지면 WHEN 제출하면 THEN POST /api/reports API가 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'report-123',
              teacher_id: 'teacher-456',
              status: 'submitted',
            }),
        } as Response)
      );
      global.fetch = mockFetch;

      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      // 카테고리 선택
      await user.click(screen.getByLabelText(/학부모/i));

      // 제목 입력
      const titleInput = screen.getByLabelText(/제목/i);
      await user.type(titleInput, '학부모 폭언 사건');

      // 설명 입력
      const descriptionInput = screen.getByLabelText(/상세 설명/i);
      await user.type(descriptionInput, '수업 중 학부모로부터 폭언을 받았습니다. 상세 내용입니다.');

      // 사건 날짜 선택
      const dateInput = screen.getByLabelText(/사건 발생일/i);
      const today = new Date().toISOString().split('T')[0];
      await user.type(dateInput, today);

      // 우선순위 선택
      await user.click(screen.getByLabelText(/높음/i));

      // 제출 버튼 클릭
      const submitButton = screen.getByRole('button', { name: /제출/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/reports',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
            body: expect.stringContaining('"category":"parent"'),
          })
        );
      });
    });

    it('GIVEN API 호출이 성공하면 WHEN 응답을 받으면 THEN /reports로 리다이렉트되어야 한다', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      const { useRouter } = await import('next/navigation');
      vi.mocked(useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        refresh: vi.fn(),
      } as any);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'report-123',
              status: 'submitted',
            }),
        } as Response)
      );

      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      // 모든 필드 채우기
      await user.click(screen.getByLabelText(/학부모/i));
      await user.type(screen.getByLabelText(/제목/i), '학부모 폭언 사건');
      await user.type(
        screen.getByLabelText(/상세 설명/i),
        '수업 중 학부모로부터 폭언을 받았습니다. 상세 내용입니다.'
      );
      const today = new Date().toISOString().split('T')[0];
      await user.type(screen.getByLabelText(/사건 발생일/i), today);
      await user.click(screen.getByLabelText(/높음/i));

      // 제출
      const submitButton = screen.getByRole('button', { name: /제출/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/reports');
      });
    });

    it('GIVEN API 호출이 실패하면 WHEN 오류를 받으면 THEN 에러 메시지가 표시되고 폼 데이터가 유지되어야 한다', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal Server Error' }),
        } as Response)
      );

      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      // 모든 필드 채우기
      await user.click(screen.getByLabelText(/학부모/i));
      const titleValue = '학부모 폭언 사건';
      await user.type(screen.getByLabelText(/제목/i), titleValue);
      await user.type(
        screen.getByLabelText(/상세 설명/i),
        '수업 중 학부모로부터 폭언을 받았습니다. 상세 내용입니다.'
      );
      const today = new Date().toISOString().split('T')[0];
      await user.type(screen.getByLabelText(/사건 발생일/i), today);
      await user.click(screen.getByLabelText(/높음/i));

      // 제출
      const submitButton = screen.getByRole('button', { name: /제출/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      await user.click(submitButton);

      // 에러 메시지 표시
      await waitFor(() => {
        expect(screen.getByText(/서버 오류가 발생했습니다/i)).toBeInTheDocument();
      });

      // 폼 데이터 유지
      expect(screen.getByLabelText(/제목/i)).toHaveValue(titleValue);
    });

    it('GIVEN 제출 중일 때 WHEN 상태가 로딩 중이면 THEN 제출 버튼이 "제출 중..." 상태여야 한다', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ id: 'report-123' }),
                } as Response),
              1000
            );
          })
      );

      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      // 모든 필드 채우기
      await user.click(screen.getByLabelText(/학부모/i));
      await user.type(screen.getByLabelText(/제목/i), '학부모 폭언 사건');
      await user.type(
        screen.getByLabelText(/상세 설명/i),
        '수업 중 학부모로부터 폭언을 받았습니다. 상세 내용입니다.'
      );
      const today = new Date().toISOString().split('T')[0];
      await user.type(screen.getByLabelText(/사건 발생일/i), today);
      await user.click(screen.getByLabelText(/높음/i));

      // 제출
      const submitButton = screen.getByRole('button', { name: /제출/i });
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      await user.click(submitButton);

      // 로딩 상태 확인
      await waitFor(() => {
        expect(screen.getByText(/제출 중.../i)).toBeInTheDocument();
      });
    });
  });

  describe('접근성', () => {
    it('GIVEN 에러가 발생하면 WHEN aria-describedby가 설정되면 THEN 스크린 리더가 감지할 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/제목/i);
      await user.type(titleInput, '짧음');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/제목은 5자 이상이어야 합니다/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('GIVEN 폼이 로드되면 WHEN Tab 키로 네비게이션하면 THEN 모든 입력 필드에 접근 가능해야 한다', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <ReportForm />
        </TestWrapper>
      );

      await user.tab(); // 첫 번째 라디오 버튼으로 이동
      expect(screen.getByLabelText(/학부모/i)).toHaveFocus();

      await user.tab(); // 제목 입력으로 이동
      expect(screen.getByLabelText(/제목/i)).toHaveFocus();

      await user.tab(); // 설명 입력으로 이동
      expect(screen.getByLabelText(/상세 설명/i)).toHaveFocus();

      await user.tab(); // 사건 날짜로 이동
      expect(screen.getByLabelText(/사건 발생일/i)).toHaveFocus();
    });
  });
});
