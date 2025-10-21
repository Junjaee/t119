// @TEST:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * SystemStatsWidget 테스트
 *
 * 관리자 대시보드 - 전체 통계 위젯
 * - 총 사용자 수 (교사/변호사)
 * - 총 신고 건수
 * - 총 매칭 건수
 * - 총 상담 건수
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemStatsWidget } from '@/features/dashboard/widgets/admin/SystemStatsWidget';

describe('SystemStatsWidget', () => {
  const mockData = {
    teacherCount: 150,
    lawyerCount: 80,
    reportCount: 320,
    matchCount: 245,
    consultationCount: 180,
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<SystemStatsWidget data={mockData} />);
    expect(screen.getByText('전체 통계')).toBeInTheDocument();
  });

  it('4개 통계 카드가 표시되어야 함', () => {
    render(<SystemStatsWidget data={mockData} />);

    // 총 사용자 수
    expect(screen.getByText('총 사용자')).toBeInTheDocument();
    expect(screen.getByText('230')).toBeInTheDocument(); // 150 + 80

    // 총 신고 건수
    expect(screen.getByText('총 신고')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();

    // 총 매칭 건수
    expect(screen.getByText('총 매칭')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();

    // 총 상담 건수
    expect(screen.getByText('총 상담')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
  });

  it('빈 데이터 처리', () => {
    const emptyData = {
      teacherCount: 0,
      lawyerCount: 0,
      reportCount: 0,
      matchCount: 0,
      consultationCount: 0,
    };

    render(<SystemStatsWidget data={emptyData} />);
    expect(screen.getByText('총 사용자')).toBeInTheDocument();
    // 여러 개의 0이 있으므로 getAllByText 사용
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('로딩 스켈레톤 표시', () => {
    render(<SystemStatsWidget isLoading />);
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });

  it('에러 메시지 표시', () => {
    render(<SystemStatsWidget error="데이터 로딩 실패" />);
    expect(screen.getByText('데이터 로딩 실패')).toBeInTheDocument();
  });
});
