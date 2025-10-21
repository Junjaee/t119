// @CODE:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/teacher/personal-stats-widget.test.tsx
/**
 * PersonalStatsWidget - 개인 통계 위젯
 *
 * 교사 대시보드 - 개인 통계 표시
 * - 총 신고 건수
 * - 평균 처리 시간
 * - 변호사 평가 점수
 * - 월별 신고 추이 차트 (Recharts)
 *
 * @SPEC:DASHBOARD-001 - 교사 대시보드
 * Ubiquitous Requirements: 시스템은 차트 및 통계 위젯을 제공해야 한다
 * Constraints: 차트 렌더링 시간은 1초를 초과하지 않아야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, Star } from 'lucide-react';

export interface PersonalStatsData {
  totalReports: number;
  avgProcessingTime: string;
  lawyerRating: number;
  monthlyReports: Array<{
    month: string;
    count: number;
  }>;
}

export interface PersonalStatsWidgetProps {
  data: PersonalStatsData;
}

/**
 * PersonalStatsWidget 컴포넌트
 */
export function PersonalStatsWidget({ data }: PersonalStatsWidgetProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">개인 통계</h2>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          title="총 신고 건수"
          value={data.totalReports}
          icon={<TrendingUp size={20} />}
          variant="primary"
        />
        <StatsCard
          title="평균 처리 시간"
          value={data.avgProcessingTime}
          icon={<Clock size={20} />}
          variant="default"
        />
        <StatsCard
          title="변호사 평가"
          value={data.lawyerRating}
          icon={<Star size={20} />}
          variant="warning"
        />
      </div>

      {/* 월별 차트 */}
      <ChartWidget
        title="월별 신고 추이"
        description="최근 3개월 신고 건수"
        height={250}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.monthlyReports}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWidget>
    </div>
  );
}
