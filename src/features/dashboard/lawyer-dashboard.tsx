// @CODE:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/features/dashboard/lawyer-dashboard.test.tsx
// 변호사 대시보드 컴포넌트

'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLawyerDashboardData, transformChartData } from './dashboard-service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface LawyerDashboardProps {
  userId: string;
}

/**
 * 변호사 대시보드 메인 컴포넌트
 * @TEST:DASHBOARD-001 - 4개 위젯, 차트 렌더링
 */
export function LawyerDashboard({ userId }: LawyerDashboardProps) {
  // 대시보드 데이터 페칭
  const { data, isLoading } = useQuery({
    queryKey: ['lawyer-dashboard', userId],
    queryFn: () => fetchLawyerDashboardData(userId),
    staleTime: 5 * 60 * 1000,
  });

  // 차트 데이터 메모이제이션
  const monthlyCasesChart = useMemo(() => {
    if (!data?.performance.monthlyCases) return [];
    return transformChartData(data.performance.monthlyCases);
  }, [data?.performance.monthlyCases]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* 위젯 1: 배정 사건 */}
      <div data-testid="widget-assigned-cases" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">배정 사건</h3>
        <p>신규 배정: {data?.assignedCases.length || 0}건</p>
        <ul className="mt-2 text-sm">
          {data?.assignedCases.slice(0, 5).map((case_) => (
            <li key={case_.id}>
              {case_.title} ({case_.severity})
            </li>
          ))}
        </ul>
      </div>

      {/* 위젯 2: 진행 중 상담 */}
      <div data-testid="widget-active-consultations" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">진행 중 상담</h3>
        <p>활성 상담: 0건</p>
      </div>

      {/* 위젯 3: 평가 점수 */}
      <div data-testid="widget-rating" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">평가 점수</h3>
        <div className="space-y-2">
          <p>평균: {data?.rating.average.toFixed(1) || 0}점</p>
          <p>리뷰 수: {data?.rating.count || 0}개</p>
        </div>
        <div data-testid="chart-rating-trend" className="mt-4 h-32">
          {/* 평가 추이 차트 */}
          <p className="text-sm text-gray-500">차트 영역</p>
        </div>
      </div>

      {/* 위젯 4: 실적 통계 */}
      <div data-testid="widget-performance" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">실적 통계</h3>
        <p>완료율: {data?.performance.completionRate.toFixed(1) || 0}%</p>
        <div data-testid="chart-monthly-cases" className="mt-4 h-32">
          {monthlyCasesChart.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCasesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
