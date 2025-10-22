// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/features/stats/components/charts.test.tsx
// TAG-005: Chart Components

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartConfig, CHART_COLORS, formatMonth } from '@/lib/charts/chart-config';
import type { TypeStats, RegionStats, TrendData } from '@/types/stats.types';

/**
 * TypeDistributionChart - 유형별 분포 차트
 */
export const TypeDistributionChart = React.memo(
  ({ data }: { data: TypeStats[] }) => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={chartConfig.margins}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="count"
            fill={chartConfig.colors.primary}
            animationDuration={chartConfig.animation.duration}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
);

TypeDistributionChart.displayName = 'TypeDistributionChart';

/**
 * MonthlyTrendsChart - 월별 추이 차트
 */
export const MonthlyTrendsChart = React.memo(
  ({ data }: { data: TrendData[] }) => {
    const formattedData = data.map((item) => ({
      ...item,
      month: formatMonth(item.month),
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={chartConfig.margins}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="report_count"
            stroke={chartConfig.colors.primary}
            animationDuration={chartConfig.animation.duration}
            name="신고 건수"
          />
          <Line
            type="monotone"
            dataKey="consultation_count"
            stroke={chartConfig.colors.secondary}
            animationDuration={chartConfig.animation.duration}
            name="상담 건수"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }
);

MonthlyTrendsChart.displayName = 'MonthlyTrendsChart';

/**
 * RegionPieChart - 지역별 비율 차트
 */
export const RegionPieChart = React.memo(
  ({ data }: { data: RegionStats[] }) => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="region"
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill={chartConfig.colors.primary}
            label={(entry) => `${entry.region}: ${entry.percentage}%`}
            animationDuration={chartConfig.animation.duration}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
);

RegionPieChart.displayName = 'RegionPieChart';

/**
 * CumulativeAreaChart - 누적 통계 차트
 */
export const CumulativeAreaChart = React.memo(
  ({ data }: { data: Array<{ month: string; cumulative_count: number }> }) => {
    const formattedData = data.map((item) => ({
      ...item,
      month: formatMonth(item.month),
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData} margin={chartConfig.margins}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="cumulative_count"
            stroke={chartConfig.colors.primary}
            fill={chartConfig.colors.primary}
            animationDuration={chartConfig.animation.duration}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
);

CumulativeAreaChart.displayName = 'CumulativeAreaChart';
