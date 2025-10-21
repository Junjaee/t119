// @CODE:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/admin/matching-status-widget.test.tsx
/**
 * MatchingStatusWidget - 매칭 현황 위젯
 *
 * 관리자 대시보드 - 매칭 현황
 * - 대기 중 매칭 수
 * - 평균 매칭 시간
 * - 매칭 성공률
 *
 * @SPEC:DASHBOARD-001 - 관리자 대시보드
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * MatchingStatusData - 매칭 현황 데이터
 */
export interface MatchingStatusData {
  /** 대기 중인 매칭 수 */
  pendingMatches: number;
  /** 평균 매칭 시간 (초) */
  avgMatchTime: number;
  /** 매칭 성공률 (%) */
  successRate: number;
  /** 매칭 상태 분포 */
  statusDistribution: {
    /** 대기 중 */
    pending: number;
    /** 매칭 완료 */
    matched: number;
    /** 취소됨 */
    cancelled: number;
  };
}

/**
 * MatchingStatusWidgetProps - 위젯 속성
 */
export interface MatchingStatusWidgetProps {
  /** 매칭 현황 데이터 */
  data: MatchingStatusData;
}

/**
 * MatchingStatusWidget 컴포넌트
 *
 * 매칭 현황을 표시합니다.
 * - 대기 중, 평균 시간, 성공률 통계
 * - PieChart로 매칭 상태 분포 시각화
 * - 대기 건수 30개 이상 시 경고 표시
 */
export function MatchingStatusWidget({ data }: MatchingStatusWidgetProps) {
  // 초를 분으로 변환 (가독성 개선)
  const avgMatchTimeMinutes = Math.round(data.avgMatchTime / 60);

  // PieChart 데이터 준비
  const pieData = [
    { name: '대기', value: data.statusDistribution.pending, color: '#f59e0b' },
    { name: '매칭', value: data.statusDistribution.matched, color: '#10b981' },
    { name: '취소', value: data.statusDistribution.cancelled, color: '#ef4444' },
  ];

  // PieChart 색상 배열
  const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="space-y-4">
      {/* 매칭 통계 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">매칭 현황</h2>

        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            title="대기 중"
            value={data.pendingMatches}
            variant={data.pendingMatches > 30 ? 'warning' : 'default'}
          />
          <StatsCard
            title="평균 시간"
            value={`${avgMatchTimeMinutes}분`}
            variant={avgMatchTimeMinutes > 10 ? 'warning' : 'default'}
          />
          <StatsCard
            title="성공률"
            value={`${data.successRate}%`}
            variant={data.successRate >= 80 ? 'success' : 'warning'}
          />
        </div>
      </Card>

      {/* 매칭 상태 분포 */}
      <ChartWidget title="매칭 상태 분포" height={250}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartWidget>
    </div>
  );
}
