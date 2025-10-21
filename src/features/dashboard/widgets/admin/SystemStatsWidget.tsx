// @CODE:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/admin/system-stats-widget.test.tsx
/**
 * SystemStatsWidget - 전체 통계 위젯
 *
 * 관리자 대시보드 - 전체 통계 표시
 * - 총 사용자 수 (교사 + 변호사)
 * - 총 신고 건수
 * - 총 매칭 건수
 * - 총 상담 건수
 *
 * @SPEC:DASHBOARD-001 - 관리자 대시보드
 * Ubiquitous Requirements: 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';
import { Users, FileText, GitMerge, MessageSquare } from 'lucide-react';

/**
 * SystemStatsData - 전체 통계 데이터
 */
export interface SystemStatsData {
  /** 교사 수 */
  teacherCount: number;
  /** 변호사 수 */
  lawyerCount: number;
  /** 신고 건수 */
  reportCount: number;
  /** 매칭 건수 */
  matchCount: number;
  /** 상담 건수 */
  consultationCount: number;
}

/**
 * SystemStatsWidgetProps - 위젯 속성
 */
export interface SystemStatsWidgetProps {
  /** 통계 데이터 */
  data?: SystemStatsData;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 메시지 */
  error?: string;
}

/**
 * SystemStatsWidget 컴포넌트
 *
 * 관리자 대시보드의 전체 통계를 표시합니다.
 * 4개의 StatsCard로 구성된 그리드 레이아웃을 사용합니다.
 *
 * @example
 * ```tsx
 * <SystemStatsWidget
 *   data={{
 *     teacherCount: 150,
 *     lawyerCount: 80,
 *     reportCount: 320,
 *     matchCount: 245,
 *     consultationCount: 180,
 *   }}
 * />
 * ```
 */
export function SystemStatsWidget({
  data,
  isLoading = false,
  error,
}: SystemStatsWidgetProps) {
  // 로딩 상태 처리
  if (isLoading) {
    return <SkeletonCard height={200} />;
  }

  // 에러 상태 처리
  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-red-600">
          {error}
        </div>
      </Card>
    );
  }

  // 데이터 없음 처리
  if (!data) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-gray-500">
          데이터를 불러올 수 없습니다
        </div>
      </Card>
    );
  }

  // 총 사용자 수 계산
  const totalUsers = data.teacherCount + data.lawyerCount;

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">전체 통계</h2>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="총 사용자"
          value={totalUsers}
          description={`교사 ${data.teacherCount} · 변호사 ${data.lawyerCount}`}
          icon={<Users size={20} />}
          variant="primary"
        />
        <StatsCard
          title="총 신고"
          value={data.reportCount}
          icon={<FileText size={20} />}
          variant="default"
        />
        <StatsCard
          title="총 매칭"
          value={data.matchCount}
          icon={<GitMerge size={20} />}
          variant="success"
        />
        <StatsCard
          title="총 상담"
          value={data.consultationCount}
          icon={<MessageSquare size={20} />}
          variant="default"
        />
      </div>
    </Card>
  );
}
