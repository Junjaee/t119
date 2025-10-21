// @TEST:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * ConsultationWidget 테스트
 *
 * 교사 대시보드 - 상담 이력 위젯
 * - 진행 중 상담 수
 * - 완료된 상담 수
 * - 다음 예정 상담 일정
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConsultationWidget } from '@/features/dashboard/widgets/teacher/ConsultationWidget';

describe('ConsultationWidget', () => {
  const mockData = {
    ongoing: 2,
    completed: 5,
    nextConsultation: {
      id: 'C001',
      lawyerName: '김변호사',
      scheduledAt: '2025-10-22 14:00',
    },
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<ConsultationWidget data={mockData} />);
    expect(screen.getByText('상담 이력')).toBeInTheDocument();
  });

  it('진행 중 상담 수가 표시되어야 함', () => {
    render(<ConsultationWidget data={mockData} />);
    const ongoingCard = screen.getByLabelText('통계 카드: 진행 중');
    expect(ongoingCard).toBeInTheDocument();
    expect(ongoingCard).toHaveTextContent('2');
  });

  it('완료된 상담 수가 표시되어야 함', () => {
    render(<ConsultationWidget data={mockData} />);
    const completedCard = screen.getByLabelText('통계 카드: 완료됨');
    expect(completedCard).toBeInTheDocument();
    expect(completedCard).toHaveTextContent('5');
  });

  it('다음 예정 상담 일정이 표시되어야 함', () => {
    render(<ConsultationWidget data={mockData} />);
    expect(screen.getByText('다음 예정 상담')).toBeInTheDocument();
    expect(screen.getByText('김변호사')).toBeInTheDocument();
    expect(screen.getByText('2025-10-22 14:00')).toBeInTheDocument();
  });

  it('예정된 상담이 없을 때 메시지가 표시되어야 함', () => {
    const noConsultationData = {
      ongoing: 0,
      completed: 3,
      nextConsultation: null,
    };
    render(<ConsultationWidget data={noConsultationData} />);
    expect(screen.getByText('예정된 상담이 없습니다')).toBeInTheDocument();
  });
});
