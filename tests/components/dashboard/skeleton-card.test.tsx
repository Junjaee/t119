// @TEST:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * SkeletonCard 컴포넌트 테스트
 *
 * Given: 스켈레톤 로딩 UI
 * When: 렌더링하면
 * Then: 애니메이션 효과가 적용되어야 한다
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

describe('SkeletonCard', () => {
  it('기본 스켈레톤을 렌더링해야 한다', () => {
    // When: 컴포넌트 렌더링
    render(<SkeletonCard />);

    // Then: skeleton 요소 존재
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument();
  });

  it('애니메이션 클래스를 가져야 한다', () => {
    // When: 컴포넌트 렌더링
    render(<SkeletonCard />);

    // Then: animate-pulse 클래스 존재
    const skeleton = screen.getByTestId('skeleton-card');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('커스텀 높이를 설정할 수 있어야 한다', () => {
    // Given: 커스텀 높이 props
    render(<SkeletonCard height={200} />);

    // Then: 높이 스타일 적용
    const skeleton = screen.getByTestId('skeleton-card');
    expect(skeleton).toHaveStyle({ height: '200px' });
  });

  it('여러 행을 렌더링할 수 있어야 한다', () => {
    // Given: rows prop
    render(<SkeletonCard rows={3} />);

    // Then: 3개의 행 존재
    const rows = screen.getAllByTestId(/skeleton-row/);
    expect(rows).toHaveLength(3);
  });
});
