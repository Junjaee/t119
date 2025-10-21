// @CODE:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/components/dashboard/chart-widget.test.tsx
/**
 * ChartWidget - 차트 래퍼 컴포넌트
 *
 * Recharts 차트를 감싸는 재사용 가능한 위젯
 * - 로딩, 에러, 빈 상태 처리
 * - 제목, 설명 지원
 * - 높이 커스터마이징
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ChartWidgetProps {
  /** 차트 제목 */
  title: string;
  /** 설명 텍스트 (선택) */
  description?: string;
  /** 차트 컴포넌트 */
  children: React.ReactNode;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 메시지 */
  error?: string;
  /** 빈 데이터 여부 */
  isEmpty?: boolean;
  /** 빈 데이터 메시지 */
  emptyMessage?: string;
  /** 차트 높이 (px) */
  height?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * ChartWidget 컴포넌트
 *
 * @SPEC:DASHBOARD-001 - Ubiquitous Requirements
 * 시스템은 차트 및 통계 위젯을 제공해야 한다
 *
 * @SPEC:DASHBOARD-001 - Constraints
 * 차트 렌더링 시간은 1초를 초과하지 않아야 한다
 */
export function ChartWidget({
  title,
  description,
  children,
  isLoading = false,
  error,
  isEmpty = false,
  emptyMessage = '데이터가 없습니다',
  height = 300,
  className,
}: ChartWidgetProps) {
  return (
    <Card className={cn('p-4', className)}>
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* 차트 영역 */}
      <figure
        role="figure"
        aria-label={title}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        {/* 로딩 상태 */}
        {isLoading && (
          <div
            data-testid="chart-skeleton"
            className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse rounded"
          >
            <span className="text-gray-400">로딩 중...</span>
          </div>
        )}

        {/* 에러 상태 */}
        {!isLoading && error && (
          <div className="w-full h-full flex items-center justify-center bg-red-50 rounded">
            <div className="text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* 빈 데이터 */}
        {!isLoading && !error && isEmpty && (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        )}

        {/* 차트 */}
        {!isLoading && !error && !isEmpty && (
          <div className="w-full h-full">{children}</div>
        )}
      </figure>
    </Card>
  );
}
