// @CODE:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/lawyer/assigned-cases-widget.test.tsx
/**
 * AssignedCasesWidget - 배정 사건 위젯
 *
 * 변호사 대시보드 - 배정 사건 표시
 * - 신규 배정 건수
 * - 진행 중 사건 목록
 * - 우선순위별 Badge (high/medium/low)
 *
 * @SPEC:DASHBOARD-001 - 변호사 대시보드
 * Ubiquitous Requirements: 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

export interface AssignedCase {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface AssignedCasesData {
  newCases: number;
  cases: AssignedCase[];
}

export interface AssignedCasesWidgetProps {
  data?: AssignedCasesData;
  isLoading?: boolean;
}

const SEVERITY_LABELS: Record<AssignedCase['severity'], string> = {
  high: '긴급',
  medium: '보통',
  low: '낮음',
};

const SEVERITY_VARIANTS: Record<AssignedCase['severity'], 'destructive' | 'default' | 'secondary'> = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
};

/**
 * AssignedCasesWidget 컴포넌트
 */
export function AssignedCasesWidget({ data, isLoading }: AssignedCasesWidgetProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!data) {
    return null;
  }

  const isEmpty = data.newCases === 0 && data.cases.length === 0;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">배정 사건</h2>

      {/* 통계 카드 */}
      <div className="mb-4">
        <StatsCard
          title="신규 배정"
          value={data.newCases}
          variant="primary"
        />
      </div>

      {/* 사건 목록 */}
      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          배정된 사건이 없습니다
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">진행 중 사건</h3>
          <ul className="space-y-2">
            {data.cases.slice(0, 5).map((caseItem) => (
              <li
                key={caseItem.id}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{caseItem.title}</span>
                  <Badge variant={SEVERITY_VARIANTS[caseItem.severity]}>
                    {SEVERITY_LABELS[caseItem.severity]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
