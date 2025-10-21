// @CODE:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/admin/system-monitoring-widget.test.tsx
/**
 * SystemMonitoringWidget - 시스템 모니터링 위젯
 *
 * 관리자 대시보드 - 시스템 모니터링
 * - 서버 응답 시간 (평균)
 * - 에러 발생 현황
 * - 데이터베이스 부하
 *
 * @SPEC:DASHBOARD-001 - 관리자 대시보드
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * SystemMonitoringData - 시스템 모니터링 데이터
 */
export interface SystemMonitoringData {
  /** 평균 응답 시간 (ms) */
  avgResponseTime: number;
  /** 에러 발생 건수 */
  errorCount: number;
  /** 데이터베이스 부하 (%) */
  dbLoad: number;
  /** 시스템 상태 */
  healthStatus: 'healthy' | 'warning' | 'critical';
  /** 응답 시간 추이 (선택) */
  responseTimeTrend?: Array<{
    /** 시간 */
    time: string;
    /** 응답 시간 (ms) */
    value: number;
  }>;
}

/**
 * SystemMonitoringWidgetProps - 위젯 속성
 */
export interface SystemMonitoringWidgetProps {
  /** 시스템 모니터링 데이터 */
  data: SystemMonitoringData;
}

/**
 * SystemMonitoringWidget 컴포넌트
 *
 * 시스템 상태를 모니터링하고 표시합니다.
 * - 응답 시간, 에러, DB 부하 통계
 * - LineChart로 응답 시간 추이 시각화
 * - 상태별 Badge 표시 (정상/주의/위험)
 */
export function SystemMonitoringWidget({ data }: SystemMonitoringWidgetProps) {
  // 상태별 라벨 및 색상 설정
  const statusConfig = {
    healthy: { label: '정상', variant: 'default' as const },
    warning: { label: '주의', variant: 'secondary' as const },
    critical: { label: '위험', variant: 'destructive' as const },
  };

  const status = statusConfig[data.healthStatus];

  return (
    <div className="space-y-4">
      {/* 시스템 지표 */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">시스템 모니터링</h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatsCard
            title="응답 시간"
            value={`${data.avgResponseTime}ms`}
            variant={data.avgResponseTime > 200 ? 'warning' : 'default'}
          />
          <StatsCard
            title="에러"
            value={data.errorCount}
            variant={data.errorCount > 5 ? 'danger' : 'default'}
          />
          <StatsCard
            title="DB 부하"
            value={`${data.dbLoad}%`}
            variant={data.dbLoad > 70 ? 'warning' : 'default'}
          />
        </div>
      </Card>

      {/* 응답 시간 추이 */}
      {data.responseTimeTrend && data.responseTimeTrend.length > 0 && (
        <ChartWidget title="응답 시간 추이" height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.responseTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWidget>
      )}
    </div>
  );
}
