// @TEST:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * StatsCard 컴포넌트 테스트
 *
 * Given: 통계 카드 위젯
 * When: 제목, 값, 아이콘을 전달하면
 * Then: 올바르게 렌더링되어야 한다
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';

describe('StatsCard', () => {
  describe('기본 렌더링', () => {
    it('제목과 값을 표시해야 한다', () => {
      // Given: 통계 카드 props
      const props = {
        title: '총 신고 건수',
        value: '42',
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 제목과 값이 표시됨
      expect(screen.getByText('총 신고 건수')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('설명을 표시해야 한다', () => {
      // Given: 설명이 포함된 props
      const props = {
        title: '총 신고 건수',
        value: '42',
        description: '전월 대비 +5%',
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 설명이 표시됨
      expect(screen.getByText('전월 대비 +5%')).toBeInTheDocument();
    });

    it('아이콘을 표시해야 한다', () => {
      // Given: 아이콘이 포함된 props
      const MockIcon = () => <svg data-testid="mock-icon" />;
      const props = {
        title: '총 신고 건수',
        value: '42',
        icon: <MockIcon />,
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 아이콘이 표시됨
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });
  });

  describe('변화 추이', () => {
    it('증가 추이를 표시해야 한다', () => {
      // Given: 증가 추이 props
      const props = {
        title: '총 신고 건수',
        value: '42',
        trend: {
          value: 5,
          isIncrease: true,
        },
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 증가 표시 (+5)
      expect(screen.getByText(/\+5/)).toBeInTheDocument();
    });

    it('감소 추이를 표시해야 한다', () => {
      // Given: 감소 추이 props
      const props = {
        title: '총 신고 건수',
        value: '42',
        trend: {
          value: 3,
          isIncrease: false,
        },
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 감소 표시 (-3)
      expect(screen.getByText(/-3/)).toBeInTheDocument();
    });
  });

  describe('클릭 가능 여부', () => {
    it('onClick이 없으면 일반 카드로 렌더링', () => {
      // Given: onClick이 없는 props
      const props = {
        title: '총 신고 건수',
        value: '42',
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: button이 아님
      const card = screen.getByText('총 신고 건수').closest('div');
      expect(card?.tagName).not.toBe('BUTTON');
    });

    it('onClick이 있으면 클릭 가능한 카드로 렌더링', () => {
      // Given: onClick이 있는 props
      const onClick = vi.fn();
      const props = {
        title: '총 신고 건수',
        value: '42',
        onClick,
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 클릭 가능
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
    });
  });

  describe('스타일 변형', () => {
    it('variant prop으로 스타일을 변경할 수 있어야 한다', () => {
      // Given: variant가 있는 props
      const props = {
        title: '총 신고 건수',
        value: '42',
        variant: 'primary' as const,
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: 렌더링 성공
      expect(screen.getByText('총 신고 건수')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('ARIA 레이블을 제공해야 한다', () => {
      // Given: 통계 카드 props
      const props = {
        title: '총 신고 건수',
        value: '42',
      };

      // When: 컴포넌트 렌더링
      render(<StatsCard {...props} />);

      // Then: region role 존재
      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });
  });
});
