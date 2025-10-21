// @CODE:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/teacher/report-stats-widget.test.tsx
/**
 * ReportStatsWidget - 내 신고 현황 위젯
 *
 * 교사 대시보드 - 내 신고 현황 표시
 * - 진행 중 신고 수
 * - 완료된 신고 수
 * - 최근 신고 목록 (최대 5개)
 *
 * @SPEC:DASHBOARD-001 - 교사 대시보드
 * Ubiquitous Requirements: 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';

export interface ReportStats {
  pending: number;
  completed: number;
  recentReports: Array<{
    id: string;
    title: string;
    status: 'pending' | 'matched' | 'completed';
    createdAt: string;
  }>;
}

export interface ReportStatsWidgetProps {
  data: ReportStats;
}

/**
 * ReportStatsWidget 컴포넌트
 */
export function ReportStatsWidget({ data }: ReportStatsWidgetProps) {
  const isEmpty = data.pending === 0 && data.completed === 0;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">내 신고 현황</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatsCard
          title="진행 중"
          value={data.pending}
          variant="primary"
        />
        <StatsCard
          title="완료"
          value={data.completed}
          variant="success"
        />
      </div>

      {/* 최근 신고 목록 */}
      {isEmpty ? (
        <div className="text-center py-8 text-gray-500">
          아직 신고 내역이 없습니다
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">최근 신고</h3>
          <ul className="space-y-2">
            {data.recentReports.slice(0, 5).map((report) => (
              <li
                key={report.id}
                className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{report.title}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      report.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : report.status === 'matched'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {report.status === 'completed'
                      ? '완료'
                      : report.status === 'matched'
                      ? '매칭됨'
                      : '대기중'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
