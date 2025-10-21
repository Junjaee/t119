// @TEST:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * AssignedCasesWidget 테스트
 *
 * 변호사 대시보드 - 배정 사건 위젯
 * - 신규 배정 건수
 * - 진행 중 사건 목록
 * - 우선순위별 Badge (high/medium/low)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssignedCasesWidget } from '@/features/dashboard/widgets/lawyer/AssignedCasesWidget';

describe('AssignedCasesWidget', () => {
  const mockData = {
    newCases: 5,
    cases: [
      {
        id: 'C001',
        title: '학교폭력 사건',
        severity: 'high' as const,
        createdAt: '2025-10-20',
      },
      {
        id: 'C002',
        title: '사이버 괴롭힘',
        severity: 'medium' as const,
        createdAt: '2025-10-19',
      },
      {
        id: 'C003',
        title: '언어폭력',
        severity: 'low' as const,
        createdAt: '2025-10-18',
      },
    ],
  };

  it('위젯 제목과 신규 배정 건수가 표시되어야 함', () => {
    render(<AssignedCasesWidget data={mockData} />);
    expect(screen.getByText('배정 사건')).toBeInTheDocument();
    expect(screen.getByText('신규 배정')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('진행 중 사건 목록이 표시되어야 함', () => {
    render(<AssignedCasesWidget data={mockData} />);
    expect(screen.getByText('학교폭력 사건')).toBeInTheDocument();
    expect(screen.getByText('사이버 괴롭힘')).toBeInTheDocument();
    expect(screen.getByText('언어폭력')).toBeInTheDocument();
  });

  it('우선순위별 Badge가 표시되어야 함', () => {
    render(<AssignedCasesWidget data={mockData} />);
    expect(screen.getByText('긴급')).toBeInTheDocument(); // high
    expect(screen.getByText('보통')).toBeInTheDocument(); // medium
    expect(screen.getByText('낮음')).toBeInTheDocument(); // low
  });

  it('데이터가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
    const emptyData = {
      newCases: 0,
      cases: [],
    };
    render(<AssignedCasesWidget data={emptyData} />);
    expect(screen.getByText('배정된 사건이 없습니다')).toBeInTheDocument();
  });

  it('로딩 상태가 표시되어야 함', () => {
    render(<AssignedCasesWidget isLoading />);
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });
});
