// @TEST:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * ReportStatsWidget 테스트
 *
 * 교사 대시보드 - 내 신고 현황 위젯
 * - 진행 중 신고 수
 * - 완료된 신고 수
 * - 최근 신고 목록 (최대 5개)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportStatsWidget } from '@/features/dashboard/widgets/teacher/ReportStatsWidget';

describe('ReportStatsWidget', () => {
  const mockData = {
    pending: 3,
    completed: 7,
    recentReports: [
      {
        id: 'R001',
        title: '학교폭력 신고',
        status: 'pending' as const,
        createdAt: '2025-10-20',
      },
      {
        id: 'R002',
        title: '사이버 괴롭힘',
        status: 'matched' as const,
        createdAt: '2025-10-19',
      },
      {
        id: 'R003',
        title: '언어폭력',
        status: 'completed' as const,
        createdAt: '2025-10-18',
      },
    ],
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<ReportStatsWidget data={mockData} />);
    expect(screen.getByText('내 신고 현황')).toBeInTheDocument();
  });

  it('진행 중 신고 수가 표시되어야 함', () => {
    render(<ReportStatsWidget data={mockData} />);
    expect(screen.getByText('진행 중')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('완료된 신고 수가 표시되어야 함', () => {
    render(<ReportStatsWidget data={mockData} />);
    // Use aria-label to find the specific stats card
    const completedCard = screen.getByLabelText('통계 카드: 완료');
    expect(completedCard).toBeInTheDocument();
    expect(completedCard).toHaveTextContent('7');
  });

  it('최근 신고 목록이 표시되어야 함 (최대 5개)', () => {
    render(<ReportStatsWidget data={mockData} />);
    expect(screen.getByText('학교폭력 신고')).toBeInTheDocument();
    expect(screen.getByText('사이버 괴롭힘')).toBeInTheDocument();
    expect(screen.getByText('언어폭력')).toBeInTheDocument();
  });

  it('데이터가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
    const emptyData = {
      pending: 0,
      completed: 0,
      recentReports: [],
    };
    render(<ReportStatsWidget data={emptyData} />);
    expect(screen.getByText('아직 신고 내역이 없습니다')).toBeInTheDocument();
  });
});
