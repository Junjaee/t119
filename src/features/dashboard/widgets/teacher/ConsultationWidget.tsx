// @CODE:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/teacher/consultation-widget.test.tsx
/**
 * ConsultationWidget - 상담 이력 위젯
 *
 * 교사 대시보드 - 상담 이력 표시
 * - 진행 중 상담 수
 * - 완료된 상담 수
 * - 다음 예정 상담 일정
 *
 * @SPEC:DASHBOARD-001 - 교사 대시보드
 * Ubiquitous Requirements: 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Calendar, Clock } from 'lucide-react';

export interface ConsultationData {
  ongoing: number;
  completed: number;
  nextConsultation: {
    id: string;
    lawyerName: string;
    scheduledAt: string;
  } | null;
}

export interface ConsultationWidgetProps {
  data: ConsultationData;
}

/**
 * ConsultationWidget 컴포넌트
 */
export function ConsultationWidget({ data }: ConsultationWidgetProps) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">상담 이력</h2>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatsCard
          title="진행 중"
          value={data.ongoing}
          variant="primary"
          icon={<Clock size={20} />}
        />
        <StatsCard
          title="완료됨"
          value={data.completed}
          variant="success"
          icon={<Calendar size={20} />}
        />
      </div>

      {/* 다음 예정 상담 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          다음 예정 상담
        </h3>
        {data.nextConsultation ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">변호사:</span>{' '}
              {data.nextConsultation.lawyerName}
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <Clock size={14} />
              {data.nextConsultation.scheduledAt}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">예정된 상담이 없습니다</p>
        )}
      </div>
    </Card>
  );
}
