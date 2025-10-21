// @TEST:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * PersonalStatsWidget 테스트
 *
 * 교사 대시보드 - 개인 통계 위젯
 * - 총 신고 건수 (월별 차트)
 * - 평균 처리 시간
 * - 변호사 평가 점수
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonalStatsWidget } from '@/features/dashboard/widgets/teacher/PersonalStatsWidget';

describe('PersonalStatsWidget', () => {
  const mockData = {
    totalReports: 15,
    avgProcessingTime: '7일',
    lawyerRating: 4.5,
    monthlyReports: [
      { month: '8월', count: 3 },
      { month: '9월', count: 5 },
      { month: '10월', count: 7 },
    ],
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<PersonalStatsWidget data={mockData} />);
    expect(screen.getByText('개인 통계')).toBeInTheDocument();
  });

  it('총 신고 건수가 표시되어야 함', () => {
    render(<PersonalStatsWidget data={mockData} />);
    expect(screen.getByText('총 신고 건수')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('평균 처리 시간이 표시되어야 함', () => {
    render(<PersonalStatsWidget data={mockData} />);
    expect(screen.getByText('평균 처리 시간')).toBeInTheDocument();
    expect(screen.getByText('7일')).toBeInTheDocument();
  });

  it('변호사 평가 점수가 표시되어야 함', () => {
    render(<PersonalStatsWidget data={mockData} />);
    expect(screen.getByText('변호사 평가')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('월별 차트가 렌더링되어야 함', () => {
    render(<PersonalStatsWidget data={mockData} />);
    // ChartWidget이 렌더링되는지 확인
    expect(screen.getByText('월별 신고 추이')).toBeInTheDocument();
    // Recharts의 ResponsiveContainer가 렌더링되는지 확인
    const chartContainer = screen.getByRole('figure');
    expect(chartContainer).toBeInTheDocument();
  });
});
