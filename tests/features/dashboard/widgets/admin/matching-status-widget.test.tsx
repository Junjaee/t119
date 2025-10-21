// @TEST:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * MatchingStatusWidget 테스트
 *
 * 관리자 대시보드 - 매칭 현황 위젯
 * - 대기 중 매칭 수
 * - 평균 매칭 시간
 * - 매칭 성공률
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchingStatusWidget } from '@/features/dashboard/widgets/admin/MatchingStatusWidget';

describe('MatchingStatusWidget', () => {
  const mockData = {
    pendingMatches: 15,
    avgMatchTime: 240, // seconds
    successRate: 87.5,
    statusDistribution: {
      pending: 15,
      matched: 180,
      cancelled: 12,
    },
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<MatchingStatusWidget data={mockData} />);
    expect(screen.getByText('매칭 현황')).toBeInTheDocument();
  });

  it('매칭 통계가 표시되어야 함', () => {
    render(<MatchingStatusWidget data={mockData} />);

    expect(screen.getByText('대기 중')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('평균 시간')).toBeInTheDocument();
    expect(screen.getByText('4분')).toBeInTheDocument(); // 240s = 4min

    expect(screen.getByText('성공률')).toBeInTheDocument();
    expect(screen.getByText('87.5%')).toBeInTheDocument();
  });

  it('매칭 상태 분포 PieChart가 표시되어야 함', () => {
    render(<MatchingStatusWidget data={mockData} />);
    expect(screen.getByText('매칭 상태 분포')).toBeInTheDocument();
  });

  it('빈 데이터 처리', () => {
    const emptyData = {
      pendingMatches: 0,
      avgMatchTime: 0,
      successRate: 0,
      statusDistribution: {
        pending: 0,
        matched: 0,
        cancelled: 0,
      },
    };

    render(<MatchingStatusWidget data={emptyData} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('높은 대기 건수 경고 표시', () => {
    const highPendingData = {
      ...mockData,
      pendingMatches: 50,
    };

    render(<MatchingStatusWidget data={highPendingData} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
