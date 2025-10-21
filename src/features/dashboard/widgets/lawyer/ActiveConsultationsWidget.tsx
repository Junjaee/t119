// @CODE:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/lawyer/active-consultations-widget.test.tsx
/**
 * ActiveConsultationsWidget - 진행 중 상담 위젯
 *
 * 변호사 대시보드 - 진행 중 상담 표시
 * - 활성 상담 수
 * - 안읽은 메시지 Badge
 * - 상담 바로가기 링크
 *
 * @SPEC:DASHBOARD-001 - 변호사 대시보드
 * Ubiquitous Requirements: 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

export interface ActiveConsultationsData {
  activeCount: number;
  unreadMessages: number;
}

export interface ActiveConsultationsWidgetProps {
  data?: ActiveConsultationsData;
  isLoading?: boolean;
}

/**
 * ActiveConsultationsWidget 컴포넌트
 */
export function ActiveConsultationsWidget({ data, isLoading }: ActiveConsultationsWidgetProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!data) {
    return null;
  }

  const isEmpty = data.activeCount === 0;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">진행 중 상담</h2>

      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          진행 중인 상담이 없습니다
        </div>
      ) : (
        <div className="space-y-4">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="활성 상담"
              value={data.activeCount}
              variant="primary"
            />
            <StatsCard
              title="안읽은 메시지"
              value={data.unreadMessages}
              variant="warning"
            />
          </div>

          {/* 바로가기 링크 */}
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <a href="/consultations">상담 바로가기</a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
