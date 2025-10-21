// @CODE:DASHBOARD-001:DASHBOARD-PAGES | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/features/dashboard/hooks/useDashboardData.test.ts
// 역할별 대시보드 데이터 페칭 Hook

'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  fetchTeacherDashboardData,
  fetchLawyerDashboardData,
  fetchAdminDashboardData,
  TeacherDashboardData,
  LawyerDashboardData,
  AdminDashboardData,
} from '../services/dashboardService';

type DashboardRole = 'teacher' | 'lawyer' | 'admin';

type DashboardData<T extends DashboardRole> = T extends 'teacher'
  ? TeacherDashboardData
  : T extends 'lawyer'
  ? LawyerDashboardData
  : AdminDashboardData;

interface UseDashboardDataOptions {
  refetchInterval?: number;
  staleTime?: number;
}

/**
 * 역할별 대시보드 데이터 페칭 Hook
 * @TEST:DASHBOARD-001 - React Query 활용, 5분 자동 리페치, 에러 처리
 *
 * @param role - 사용자 역할 (teacher, lawyer, admin)
 * @param userId - 사용자 ID
 * @param options - 옵션 (refetchInterval, staleTime)
 * @returns React Query 결과 (data, isLoading, error, refetch 등)
 *
 * @example
 * const { data, isLoading } = useDashboardData('teacher', 'user-123');
 */
export function useDashboardData<T extends DashboardRole>(
  role: T,
  userId: string,
  options?: UseDashboardDataOptions
) {
  // 역할별 데이터 페칭 함수 매핑
  const fetchFunction = {
    teacher: () => fetchTeacherDashboardData(userId),
    lawyer: () => fetchLawyerDashboardData(userId),
    admin: () => fetchAdminDashboardData(),
  }[role];

  return useQuery<DashboardData<T>>({
    queryKey: [`${role}-dashboard`, userId],
    queryFn: fetchFunction as () => Promise<DashboardData<T>>,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5분 (캐시 유지)
    refetchInterval: options?.refetchInterval ?? 5 * 60 * 1000, // 5분 자동 갱신 (SPEC 요구사항)
    refetchOnWindowFocus: true, // 포커스 복귀 시 갱신
    retry: 3, // 실패 시 3회 재시도
  });
}
