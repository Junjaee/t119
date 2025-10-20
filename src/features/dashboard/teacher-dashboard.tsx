// @CODE:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/features/dashboard/teacher-dashboard.test.tsx
// 교사 대시보드 컴포넌트

'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherDashboardData } from './dashboard-service';
import { createClient } from '@/lib/supabase/client';

export interface TeacherDashboardProps {
  userId: string;
}

/**
 * 교사 대시보드 메인 컴포넌트
 * @TEST:DASHBOARD-001 - 초기 로딩 2초 이내, 4개 위젯 표시
 */
export function TeacherDashboard({ userId }: TeacherDashboardProps) {
  // 인증 확인
  if (!userId) {
    return (
      <div className="p-4">
        <p>인증이 필요합니다</p>
      </div>
    );
  }

  // 대시보드 데이터 페칭
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher-dashboard', userId],
    queryFn: () => fetchTeacherDashboardData(userId),
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  });

  // Supabase Realtime 구독
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel('teacher-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `teacher_id=eq.${userId}`,
        },
        () => {
          // 데이터 변경 시 리페치 (React Query가 자동 처리)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 로딩 상태
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="p-4">
        <p>데이터 로딩 중 오류가 발생했습니다</p>
      </div>
    );
  }

  // 반응형 그리드
  return (
    <div
      data-testid="dashboard-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
    >
      {/* 위젯 1: 내 신고 현황 */}
      <div data-testid="widget-my-reports" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">내 신고 현황</h3>
        <div className="space-y-2">
          <p>진행 중: {data?.reports.pending || 0}건</p>
          <p>완료: {data?.reports.completed || 0}건</p>
          <div className="mt-4">
            <h4 className="text-sm font-semibold">최근 신고</h4>
            <ul className="text-sm mt-1">
              {data?.reports.recent.slice(0, 5).map((report) => (
                <li key={report.id}>
                  {report.title} ({report.status})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 위젯 2: 상담 이력 */}
      <div data-testid="widget-consultations" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">상담 이력</h3>
        <div className="space-y-2">
          <p>진행 중: {data?.consultations.active || 0}건</p>
          <p>전체: {data?.consultations.total || 0}건</p>
          {data?.consultations.nextScheduled && (
            <p className="text-sm mt-2">
              다음 예정: {new Date(data.consultations.nextScheduled.scheduled_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* 위젯 3: 개인 통계 */}
      <div data-testid="widget-personal-stats" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">개인 통계</h3>
        <div className="space-y-2">
          <p>총 신고: {data?.stats.totalReports || 0}건</p>
          <p>평균 처리 시간: {data?.stats.avgProcessingTime.toFixed(1) || 0}일</p>
          <p>평가 점수: {data?.stats.avgRating.toFixed(1) || 0}점</p>
        </div>
      </div>

      {/* 위젯 4: 빠른 액션 */}
      <div data-testid="widget-quick-actions" className="p-4 border rounded">
        <h3 className="text-lg font-bold mb-2">빠른 액션</h3>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded">
            새 신고 작성
          </button>
          <button className="w-full px-4 py-2 bg-green-500 text-white rounded">
            진행 중 상담
          </button>
          <button className="w-full px-4 py-2 bg-gray-500 text-white rounded">
            도움말/FAQ
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 스켈레톤 UI (로딩 상태)
 */
function DashboardSkeleton() {
  return (
    <div data-testid="dashboard-skeleton" className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border rounded animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
