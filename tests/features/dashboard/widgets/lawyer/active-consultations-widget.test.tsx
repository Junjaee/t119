// @TEST:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * ActiveConsultationsWidget 테스트
 *
 * 변호사 대시보드 - 진행 중 상담 위젯
 * - 활성 상담 수
 * - 안읽은 메시지 Badge
 * - 상담 바로가기 링크
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveConsultationsWidget } from '@/features/dashboard/widgets/lawyer/ActiveConsultationsWidget';

describe('ActiveConsultationsWidget', () => {
  const mockData = {
    activeCount: 3,
    unreadMessages: 7,
  };

  it('위젯 제목과 활성 상담 수가 표시되어야 함', () => {
    render(<ActiveConsultationsWidget data={mockData} />);
    expect(screen.getByText('진행 중 상담')).toBeInTheDocument();
    expect(screen.getByText('활성 상담')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('안읽은 메시지 Badge가 표시되어야 함', () => {
    render(<ActiveConsultationsWidget data={mockData} />);
    expect(screen.getByText('안읽은 메시지')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('상담 바로가기 링크가 표시되어야 함', () => {
    render(<ActiveConsultationsWidget data={mockData} />);
    const link = screen.getByText('상담 바로가기');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/consultations');
  });

  it('데이터가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
    const emptyData = {
      activeCount: 0,
      unreadMessages: 0,
    };
    render(<ActiveConsultationsWidget data={emptyData} />);
    expect(screen.getByText('진행 중인 상담이 없습니다')).toBeInTheDocument();
  });

  it('로딩 상태가 표시되어야 함', () => {
    render(<ActiveConsultationsWidget isLoading />);
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });
});
