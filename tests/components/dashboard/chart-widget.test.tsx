// @TEST:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * ChartWidget 컴포넌트 테스트
 *
 * Given: 차트 위젯 래퍼
 * When: 제목, 차트 컴포넌트를 전달하면
 * Then: Card 안에 렌더링되어야 한다
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartWidget } from '@/components/dashboard/ChartWidget';

describe('ChartWidget', () => {
  describe('기본 렌더링', () => {
    it('제목과 차트를 표시해야 한다', () => {
      // Given: 차트 위젯 props
      const MockChart = () => <div data-testid="mock-chart">Chart</div>;
      const props = {
        title: '월별 신고 현황',
        children: <MockChart />,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 제목과 차트가 표시됨
      expect(screen.getByText('월별 신고 현황')).toBeInTheDocument();
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('설명을 표시해야 한다', () => {
      // Given: 설명이 포함된 props
      const props = {
        title: '월별 신고 현황',
        description: '최근 12개월 데이터',
        children: <div>Chart</div>,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 설명이 표시됨
      expect(screen.getByText('최근 12개월 데이터')).toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤을 표시해야 한다', () => {
      // Given: 로딩 상태 props
      const props = {
        title: '월별 신고 현황',
        children: <div>Chart</div>,
        isLoading: true,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 스켈레톤 표시
      expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
      // 차트는 숨김
      expect(screen.queryByText('Chart')).not.toBeInTheDocument();
    });

    it('로딩 완료 후 차트를 표시해야 한다', () => {
      // Given: 로딩 완료 props
      const props = {
        title: '월별 신고 현황',
        children: <div>Chart</div>,
        isLoading: false,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 차트 표시
      expect(screen.getByText('Chart')).toBeInTheDocument();
      // 스켈레톤 숨김
      expect(screen.queryByTestId('chart-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('에러 상태', () => {
    it('에러 메시지를 표시해야 한다', () => {
      // Given: 에러 상태 props
      const props = {
        title: '월별 신고 현황',
        children: <div>Chart</div>,
        error: '데이터를 불러올 수 없습니다',
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 에러 메시지 표시
      expect(screen.getByText('데이터를 불러올 수 없습니다')).toBeInTheDocument();
      // 차트는 숨김
      expect(screen.queryByText('Chart')).not.toBeInTheDocument();
    });
  });

  describe('빈 데이터 상태', () => {
    it('빈 상태 메시지를 표시해야 한다', () => {
      // Given: 빈 데이터 props
      const props = {
        title: '월별 신고 현황',
        children: <div>Chart</div>,
        isEmpty: true,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 빈 상태 메시지 표시
      expect(screen.getByText(/데이터가 없습니다/)).toBeInTheDocument();
    });

    it('커스텀 빈 상태 메시지를 표시해야 한다', () => {
      // Given: 커스텀 빈 메시지 props
      const props = {
        title: '월별 신고 현황',
        children: <div>Chart</div>,
        isEmpty: true,
        emptyMessage: '아직 신고가 없습니다',
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 커스텀 메시지 표시
      expect(screen.getByText('아직 신고가 없습니다')).toBeInTheDocument();
    });
  });

  describe('높이 설정', () => {
    it('기본 높이(300px)를 사용해야 한다', () => {
      // Given: 높이 미지정 props
      const props = {
        title: '월별 신고 현황',
        children: <div data-testid="chart-content">Chart</div>,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 기본 높이 적용
      const figure = screen.getByRole('figure');
      expect(figure).toHaveStyle({ height: '300px' });
    });

    it('커스텀 높이를 설정할 수 있어야 한다', () => {
      // Given: 커스텀 높이 props
      const props = {
        title: '월별 신고 현황',
        children: <div data-testid="chart-content">Chart</div>,
        height: 400,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: 커스텀 높이 적용
      const figure = screen.getByRole('figure');
      expect(figure).toHaveStyle({ height: '400px' });
    });
  });

  describe('접근성', () => {
    it('ARIA 레이블을 제공해야 한다', () => {
      // Given: 차트 위젯 props
      const props = {
        title: '월별 신고 현황',
        children: <div>Chart</div>,
      };

      // When: 컴포넌트 렌더링
      render(<ChartWidget {...props} />);

      // Then: figure role 존재
      const figure = screen.getByRole('figure');
      expect(figure).toBeInTheDocument();
      expect(figure).toHaveAttribute('aria-label', '월별 신고 현황');
    });
  });
});
