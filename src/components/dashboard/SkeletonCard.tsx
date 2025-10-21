// @CODE:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/components/dashboard/skeleton-card.test.tsx
/**
 * SkeletonCard - 로딩 스켈레톤 UI
 *
 * 대시보드 로딩 상태를 표시하는 스켈레톤 컴포넌트
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SkeletonCardProps {
  /** 높이 (px) */
  height?: number;
  /** 행 개수 */
  rows?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * SkeletonCard 컴포넌트
 *
 * @SPEC:DASHBOARD-001 - State-driven Requirements
 * WHILE 데이터 로딩 중일 때, 시스템은 스켈레톤 UI를 표시해야 한다
 */
export function SkeletonCard({
  height = 150,
  rows = 3,
  className,
}: SkeletonCardProps) {
  return (
    <Card
      data-testid="skeleton-card"
      className={cn('p-4 animate-pulse', className)}
      style={{ height: `${height}px` }}
    >
      {/* 제목 스켈레톤 */}
      <div className="h-6 bg-gray-200 rounded mb-4 w-2/3"></div>

      {/* 내용 행 스켈레톤 */}
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          data-testid={`skeleton-row-${index}`}
          className={cn(
            'h-4 bg-gray-200 rounded mb-2',
            index === rows - 1 ? 'w-1/2' : 'w-full'
          )}
        ></div>
      ))}
    </Card>
  );
}
