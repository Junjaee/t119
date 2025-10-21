// @TEST:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * QuickActionsWidget 테스트
 *
 * 교사 대시보드 - 빠른 액션 위젯
 * - 새 신고 작성 버튼
 * - 진행 중 상담 바로가기
 * - 도움말/FAQ
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionsWidget } from '@/features/dashboard/widgets/teacher/QuickActionsWidget';

describe('QuickActionsWidget', () => {
  it('위젯 제목이 표시되어야 함', () => {
    render(<QuickActionsWidget />);
    expect(screen.getByText('빠른 액션')).toBeInTheDocument();
  });

  it('새 신고 작성 버튼이 표시되어야 함', () => {
    render(<QuickActionsWidget />);
    expect(screen.getByText('새 신고 작성')).toBeInTheDocument();
  });

  it('진행 중 상담 바로가기 버튼이 표시되어야 함', () => {
    render(<QuickActionsWidget />);
    expect(screen.getByText('진행 중 상담')).toBeInTheDocument();
  });

  it('도움말 버튼이 표시되어야 함', () => {
    render(<QuickActionsWidget />);
    expect(screen.getByText('도움말')).toBeInTheDocument();
  });

  it('버튼 클릭 시 핸들러가 호출되어야 함', async () => {
    const user = userEvent.setup();
    const onNewReport = vi.fn();
    const onConsultations = vi.fn();
    const onHelp = vi.fn();

    render(
      <QuickActionsWidget
        onNewReport={onNewReport}
        onConsultations={onConsultations}
        onHelp={onHelp}
      />
    );

    // 새 신고 작성 버튼 클릭
    await user.click(screen.getByText('새 신고 작성'));
    expect(onNewReport).toHaveBeenCalledTimes(1);

    // 진행 중 상담 버튼 클릭
    await user.click(screen.getByText('진행 중 상담'));
    expect(onConsultations).toHaveBeenCalledTimes(1);

    // 도움말 버튼 클릭
    await user.click(screen.getByText('도움말'));
    expect(onHelp).toHaveBeenCalledTimes(1);
  });
});
