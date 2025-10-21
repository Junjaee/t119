// @TEST:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * UserManagementWidget 테스트
 *
 * 관리자 대시보드 - 사용자 관리 위젯
 * - 신규 가입 사용자 (최근 7일)
 * - 활성 사용자 (DAU/MAU)
 * - 사용자 승인 대기 목록
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserManagementWidget } from '@/features/dashboard/widgets/admin/UserManagementWidget';

describe('UserManagementWidget', () => {
  const mockData = {
    newUsers: {
      teacher: 12,
      lawyer: 8,
    },
    activeUsers: {
      dau: 145,
      mau: 420,
    },
    pendingApprovals: [
      {
        id: 'U001',
        name: '김변호사',
        role: 'lawyer' as const,
        createdAt: '2025-10-20',
      },
      {
        id: 'U002',
        name: '이교사',
        role: 'teacher' as const,
        createdAt: '2025-10-19',
      },
    ],
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<UserManagementWidget data={mockData} />);
    expect(screen.getByText('사용자 관리')).toBeInTheDocument();
  });

  it('신규 가입 사용자 BarChart가 표시되어야 함', () => {
    render(<UserManagementWidget data={mockData} />);
    expect(screen.getByText('신규 가입 (7일)')).toBeInTheDocument();
    expect(screen.getByText('교사: 12')).toBeInTheDocument();
    expect(screen.getByText('변호사: 8')).toBeInTheDocument();
  });

  it('활성 사용자 통계가 표시되어야 함', () => {
    render(<UserManagementWidget data={mockData} />);
    expect(screen.getByText('DAU')).toBeInTheDocument();
    expect(screen.getByText('145')).toBeInTheDocument();
    expect(screen.getByText('MAU')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
  });

  it('승인 대기 목록이 표시되어야 함', () => {
    render(<UserManagementWidget data={mockData} />);
    expect(screen.getByText('승인 대기')).toBeInTheDocument();
    expect(screen.getByText('김변호사')).toBeInTheDocument();
    expect(screen.getByText('이교사')).toBeInTheDocument();
  });

  it('빈 승인 대기 목록 처리', () => {
    const emptyData = {
      ...mockData,
      pendingApprovals: [],
    };

    render(<UserManagementWidget data={emptyData} />);
    expect(screen.getByText('승인 대기 중인 사용자가 없습니다')).toBeInTheDocument();
  });
});
