// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/app/stats/stats-page.test.tsx
// TAG-008: Stats Dashboard Page

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TypeDistributionChart,
  MonthlyTrendsChart,
  RegionPieChart,
  CumulativeAreaChart,
} from '@/features/stats/components/charts';

export default function StatsPage() {
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: '',
  });

  // Fetch overview stats with React Query
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['stats', 'overview', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);

      const response = await fetch(`/api/stats/overview?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch overview stats');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  // Fetch trends data
  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['stats', 'trends', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start_date) params.append('start_date', dateRange.start_date);
      if (dateRange.end_date) params.append('end_date', dateRange.end_date);

      const response = await fetch(`/api/stats/trends?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: dateRange.start_date || '2025-01-01',
          end_date: dateRange.end_date || new Date().toISOString().split('T')[0],
          include_charts: ['type', 'region', 'trends'],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const data = await response.json();
      window.open(data.pdf_url, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('PDF 생성 실패');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">통계 대시보드</h1>

      {/* Date Range Picker */}
      <div className="mb-8 flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-2">시작일</label>
          <input
            type="date"
            value={dateRange.start_date}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start_date: e.target.value }))
            }
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">종료일</label>
          <input
            type="date"
            value={dateRange.end_date}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end_date: e.target.value }))
            }
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={handleDownloadPDF}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          PDF 다운로드
        </button>
      </div>

      {/* Overview Stats */}
      {isOverviewLoading ? (
        <div className="mb-8">데이터를 불러오는 중...</div>
      ) : overviewData ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">총 신고 건수</h3>
            <p className="text-3xl font-bold">{overviewData.overview.total_reports}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">진행 중 상담</h3>
            <p className="text-3xl font-bold">
              {overviewData.overview.active_consultations}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">상담 완료율</h3>
            <p className="text-3xl font-bold">
              {overviewData.overview.completion_rate}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-600 mb-2">평균 처리 일수</h3>
            <p className="text-3xl font-bold">
              {overviewData.overview.avg_processing_days}일
            </p>
          </div>
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">유형별 분포</h2>
          {overviewData && <TypeDistributionChart data={overviewData.by_type} />}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">지역별 분포</h2>
          {overviewData && <RegionPieChart data={overviewData.by_region} />}
        </div>

        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h2 className="text-xl font-bold mb-4">월별 추이</h2>
          {trendsData && <MonthlyTrendsChart data={trendsData.trends} />}
        </div>
      </div>
    </div>
  );
}
