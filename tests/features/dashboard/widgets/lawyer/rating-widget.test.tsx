// @TEST:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * RatingWidget 테스트
 *
 * 변호사 대시보드 - 평가 점수 위젯
 * - 평균 평가 점수 (별점 형식)
 * - 최근 리뷰 목록 (최대 3개)
 * - 월별 평가 추이 차트 (LineChart)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingWidget } from '@/features/dashboard/widgets/lawyer/RatingWidget';

describe('RatingWidget', () => {
  const mockData = {
    avgRating: 4.5,
    reviewCount: 42,
    recentReviews: [
      {
        id: 'R001',
        rating: 5,
        comment: '매우 친절하고 전문적입니다',
        date: '2025-10-20',
      },
      {
        id: 'R002',
        rating: 4,
        comment: '상담이 도움이 되었습니다',
        date: '2025-10-19',
      },
      {
        id: 'R003',
        rating: 5,
        comment: '다시 상담 받고 싶습니다',
        date: '2025-10-18',
      },
    ],
    monthlyData: [
      { month: '2025-07', rating: 4.2 },
      { month: '2025-08', rating: 4.4 },
      { month: '2025-09', rating: 4.5 },
    ],
  };

  it('위젯 제목과 평균 평가 점수가 표시되어야 함', () => {
    render(<RatingWidget data={mockData} />);
    expect(screen.getByText('평가 점수')).toBeInTheDocument();
    expect(screen.getByText('평균 평가')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('최근 리뷰 목록이 표시되어야 함 (최대 3개)', () => {
    render(<RatingWidget data={mockData} />);
    expect(screen.getByText('매우 친절하고 전문적입니다')).toBeInTheDocument();
    expect(screen.getByText('상담이 도움이 되었습니다')).toBeInTheDocument();
    expect(screen.getByText('다시 상담 받고 싶습니다')).toBeInTheDocument();
  });

  it('월별 평가 추이 차트가 표시되어야 함', () => {
    render(<RatingWidget data={mockData} />);
    // ChartWidget 내부의 차트는 ResizeObserver mock으로 렌더링 확인
    const chartContainer = screen.getByTestId('chart-widget');
    expect(chartContainer).toBeInTheDocument();
  });

  it('데이터가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
    const emptyData = {
      avgRating: 0,
      reviewCount: 0,
      recentReviews: [],
      monthlyData: [],
    };
    render(<RatingWidget data={emptyData} />);
    expect(screen.getByText('아직 평가가 없습니다')).toBeInTheDocument();
  });

  it('로딩 상태가 표시되어야 함', () => {
    render(<RatingWidget isLoading />);
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });
});
