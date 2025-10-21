// @TEST:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * PerformanceStatsWidget 테스트
 *
 * 변호사 대시보드 - 실적 통계 위젯
 * - 월별 처리 건수
 * - 평균 상담 시간
 * - 완료율 (% 형식)
 * - 월별 처리 건수 차트 (BarChart)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PerformanceStatsWidget } from '@/features/dashboard/widgets/lawyer/PerformanceStatsWidget';

describe('PerformanceStatsWidget', () => {
  const mockData = {
    monthlyCases: 28,
    avgConsultationTime: '2.5시간',
    completionRate: 92,
    monthlyData: [
      { month: '2025-07', count: 20 },
      { month: '2025-08', count: 25 },
      { month: '2025-09', count: 28 },
    ],
  };

  it('위젯 제목과 월별 처리 건수가 표시되어야 함', () => {
    render(<PerformanceStatsWidget data={mockData} />);
    expect(screen.getByText('실적 통계')).toBeInTheDocument();
    // "월별 처리 건수" 텍스트가 StatsCard와 ChartWidget에 중복되므로 getAllByText 사용
    const monthlyLabels = screen.getAllByText('월별 처리 건수');
    expect(monthlyLabels.length).toBeGreaterThan(0);
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('평균 상담 시간이 표시되어야 함', () => {
    render(<PerformanceStatsWidget data={mockData} />);
    expect(screen.getByText('평균 상담 시간')).toBeInTheDocument();
    expect(screen.getByText('2.5시간')).toBeInTheDocument();
  });

  it('완료율이 % 형식으로 표시되어야 함', () => {
    render(<PerformanceStatsWidget data={mockData} />);
    expect(screen.getByText('완료율')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('월별 처리 건수 차트가 표시되어야 함', () => {
    render(<PerformanceStatsWidget data={mockData} />);
    // ChartWidget 내부의 차트는 ResizeObserver mock으로 렌더링 확인
    const chartContainer = screen.getByTestId('chart-widget');
    expect(chartContainer).toBeInTheDocument();
  });

  it('로딩 상태가 표시되어야 함', () => {
    render(<PerformanceStatsWidget isLoading />);
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });
});
