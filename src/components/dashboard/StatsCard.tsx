// @CODE:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/components/dashboard/stats-card.test.tsx
/**
 * StatsCard - 통계 카드 위젯
 *
 * 대시보드에서 사용하는 통계 정보 표시 카드
 * - 제목, 값, 설명, 아이콘 지원
 * - 증감 추이 표시
 * - 클릭 이벤트 지원
 * - 다양한 변형 스타일
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  /** 카드 제목 */
  title: string;
  /** 통계 값 */
  value: string | number;
  /** 설명 텍스트 (선택) */
  description?: string;
  /** 아이콘 (선택) */
  icon?: React.ReactNode;
  /** 증감 추이 (선택) */
  trend?: {
    value: number;
    isIncrease: boolean;
  };
  /** 클릭 핸들러 (선택) */
  onClick?: () => void;
  /** 스타일 변형 */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * StatsCard 컴포넌트
 *
 * @SPEC:DASHBOARD-001 - Ubiquitous Requirements
 * 시스템은 차트 및 통계 위젯을 제공해야 한다
 */
export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  onClick,
  variant = 'default',
  className,
}: StatsCardProps) {
  // 변형별 스타일
  const variantStyles = {
    default: '',
    primary: 'border-blue-500 bg-blue-50',
    success: 'border-green-500 bg-green-50',
    warning: 'border-yellow-500 bg-yellow-50',
    danger: 'border-red-500 bg-red-50',
  };

  // 클릭 가능 여부에 따른 스타일
  const clickableStyles = onClick
    ? 'cursor-pointer hover:shadow-md transition-shadow'
    : '';

  // 컴포넌트 래퍼 (클릭 가능 여부에 따라 button/div 선택)
  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? {
        onClick,
        type: 'button' as const,
        role: 'button',
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'w-full text-left',
        clickableStyles,
        className
      )}
    >
      <Card
        role="region"
        aria-label={`통계 카드: ${title}`}
        className={cn(
          'p-4',
          variantStyles[variant]
        )}
      >
        {/* 헤더: 제목 + 아이콘 */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>

        {/* 값 */}
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {value}
        </div>

        {/* 설명 또는 추이 */}
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span
              className={cn(
                'font-medium',
                trend.isIncrease ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.isIncrease ? '+' : '-'}
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-gray-500">{description}</span>
          )}
        </div>
      </Card>
    </Wrapper>
  );
}
