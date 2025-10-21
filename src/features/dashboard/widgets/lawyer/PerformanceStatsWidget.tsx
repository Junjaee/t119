// @CODE:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/lawyer/performance-stats-widget.test.tsx
/**
 * PerformanceStatsWidget - 실적 통계 위젯
 *
 * 변호사 대시보드 - 실적 통계 표시
 * - 월별 처리 건수
 * - 평균 상담 시간
 * - 완료율 (% 형식)
 * - 월별 처리 건수 차트 (BarChart)
 *
 * @SPEC:DASHBOARD-001 - 변호사 대시보드
 * Ubiquitous Requirements: 시스템은 차트 및 통계 위젯을 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

export interface PerformanceData {
  monthlyCases: number;
  avgConsultationTime: string;
  completionRate: number;
  monthlyData: Array<{
    month: string;
    count: number;
  }>;
}

export interface PerformanceStatsWidgetProps {
  data?: PerformanceData;
  isLoading?: boolean;
}

/**
 * PerformanceStatsWidget 컴포넌트
 */
export function PerformanceStatsWidget({ data, isLoading }: PerformanceStatsWidgetProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">실적 통계</h2>

      <div className="space-y-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            title="월별 처리 건수"
            value={data.monthlyCases}
            variant="primary"
          />
          <StatsCard
            title="평균 상담 시간"
            value={data.avgConsultationTime}
            variant="info"
          />
          <StatsCard
            title="완료율"
            value={`${data.completionRate}%`}
            variant="success"
          />
        </div>

        {/* 월별 처리 건수 차트 */}
        {data.monthlyData.length > 0 && (
          <ChartWidget title="월별 처리 건수">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWidget>
        )}
      </div>
    </Card>
  );
}
