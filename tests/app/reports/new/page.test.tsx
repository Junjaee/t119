// @TEST:REPORT-FORM-001:F3 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md
// 신고 작성 페이지 테스트

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportNewPage from '@/app/reports/new/page';

// Mock Next.js router
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock ReportForm component
vi.mock('@/components/reports/ReportForm', () => ({
  default: () => <div data-testid="report-form">ReportForm Component</div>,
}));

// Mock useAuth hook
const mockLogout = vi.fn();
let mockAuthState = {
  user: { id: '1', email: 'teacher@example.com', name: 'Teacher', role: 'teacher' as const },
  isLoading: false,
  isAuthenticated: true,
  logout: mockLogout,
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('@TEST:REPORT-FORM-001:F3 - Report Creation Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth state to teacher
    mockAuthState = {
      user: { id: '1', email: 'teacher@example.com', name: 'Teacher', role: 'teacher' as const },
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('페이지 렌더링', () => {
    it('GIVEN 교사가 /reports/new 페이지를 방문하면 WHEN 페이지가 로드되면 THEN 신고 작성 폼이 표시되어야 한다', async () => {
      render(<ReportNewPage />);

      await waitFor(() => {
        expect(screen.getByTestId('report-form')).toBeInTheDocument();
      });
    });

    it('GIVEN 페이지가 로드되면 WHEN 렌더링되면 THEN "신고 작성" 제목이 표시되어야 한다', async () => {
      render(<ReportNewPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /신고 작성/i })).toBeInTheDocument();
      });
    });

    it('GIVEN 페이지가 로드되면 WHEN 렌더링되면 THEN 뒤로가기 버튼이 표시되어야 한다', async () => {
      render(<ReportNewPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /뒤로가기/i })).toBeInTheDocument();
      });
    });
  });

  describe('인증 및 권한', () => {
    it('GIVEN 로그인하지 않은 사용자가 /reports/new에 접근하면 WHEN 페이지를 요청하면 THEN /auth/login으로 리다이렉트되어야 한다', async () => {
      // Arrange: 비인증 상태
      mockAuthState = {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: mockLogout,
      };

      // Act
      render(<ReportNewPage />);

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('GIVEN 변호사 역할의 사용자가 /reports/new에 접근하면 WHEN 페이지를 요청하면 THEN /dashboard로 리다이렉트되어야 한다', async () => {
      // Arrange: 변호사 역할
      mockAuthState = {
        user: { id: '2', email: 'lawyer@example.com', name: 'Lawyer', role: 'lawyer' as const },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      };

      // Act
      render(<ReportNewPage />);

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('GIVEN 교사 역할의 사용자가 /reports/new에 접근하면 WHEN 페이지를 요청하면 THEN 페이지가 정상적으로 로드되어야 한다', async () => {
      // Arrange: 교사 역할 (기본 mockAuthState)
      // Act
      render(<ReportNewPage />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('report-form')).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('GIVEN 로딩 중일 때 WHEN 페이지를 렌더링하면 THEN 로딩 표시가 나타나야 한다', async () => {
      // Arrange: 로딩 상태
      mockAuthState = {
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: mockLogout,
      };

      // Act
      render(<ReportNewPage />);

      // Assert
      expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
    });
  });

  describe('사용자 상호작용', () => {
    it('GIVEN 뒤로가기 버튼이 표시되었을 때 WHEN 클릭하면 THEN 이전 페이지로 돌아가야 한다', async () => {
      const user = userEvent.setup();
      render(<ReportNewPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /뒤로가기/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /뒤로가기/i });
      await user.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('반응형 디자인', () => {
    it('GIVEN 페이지가 렌더링되면 WHEN 반응형 컨테이너를 확인하면 THEN 적절한 클래스가 적용되어야 한다', async () => {
      const { container } = render(<ReportNewPage />);

      await waitFor(() => {
        expect(screen.getByTestId('report-form')).toBeInTheDocument();
      });

      // 반응형 컨테이너 클래스 확인
      const mainContainer = container.querySelector('.max-w-2xl');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('GIVEN 페이지가 렌더링되면 WHEN h1 태그를 확인하면 THEN 페이지 제목이 올바르게 표시되어야 한다', async () => {
      render(<ReportNewPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1, name: /신고 작성/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('GIVEN 페이지가 렌더링되면 WHEN 버튼을 확인하면 THEN aria-label이 적용되어야 한다', async () => {
      render(<ReportNewPage />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /뒤로가기/i });
        expect(backButton).toHaveAttribute('aria-label', '뒤로가기');
      });
    });
  });
});
