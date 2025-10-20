// @CODE:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/features/dashboard/dashboard-data.test.ts
// 대시보드 데이터 페칭 서비스

import { createClient } from '@/lib/supabase/client';

/**
 * 교사 대시보드 데이터 타입
 */
export interface TeacherDashboardData {
  reports: {
    pending: number;
    completed: number;
    recent: Array<{
      id: string;
      title: string;
      status: string;
      created_at: string;
    }>;
  };
  consultations: {
    active: number;
    total: number;
    nextScheduled?: {
      id: string;
      scheduled_at: string;
    };
  };
  stats: {
    totalReports: number;
    avgProcessingTime: number;
    avgRating: number;
  };
}

/**
 * 변호사 대시보드 데이터 타입
 */
export interface LawyerDashboardData {
  assignedCases: Array<{
    id: string;
    title: string;
    severity: string;
    assigned_at: string;
  }>;
  rating: {
    average: number;
    count: number;
  };
  performance: {
    monthlyCases: Array<{
      month: string;
      count: number;
    }>;
    completionRate: number;
  };
}

/**
 * 차트 데이터 타입
 */
export interface ChartDataPoint {
  name: string;
  value: number;
}

/**
 * 교사 대시보드 데이터 페칭 (병렬 처리)
 */
export async function fetchTeacherDashboardData(
  userId: string
): Promise<TeacherDashboardData> {
  const supabase = createClient();

  // 병렬 페칭으로 성능 최적화
  const [reportsResult, consultationsResult, statsResult] = await Promise.all([
    // 신고 현황
    supabase
      .from('reports')
      .select('id, title, status, created_at')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false }),

    // 상담 이력
    supabase
      .from('consultations')
      .select('id, status, scheduled_at')
      .eq('teacher_id', userId),

    // 개인 통계
    supabase
      .from('reports')
      .select('id, created_at, updated_at')
      .eq('teacher_id', userId),
  ]);

  const reports = reportsResult.data || [];
  const consultations = consultationsResult.data || [];

  return {
    reports: {
      pending: reports.filter((r) => r.status === 'pending').length,
      completed: reports.filter((r) => r.status === 'completed').length,
      recent: reports.slice(0, 5),
    },
    consultations: {
      active: consultations.filter((c) => c.status === 'active').length,
      total: consultations.length,
      nextScheduled: consultations
        .filter((c) => c.status === 'scheduled')
        .sort((a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )[0],
    },
    stats: {
      totalReports: reports.length,
      avgProcessingTime: calculateAvgProcessingTime(reports),
      avgRating: 4.5, // Mock value
    },
  };
}

/**
 * 변호사 대시보드 데이터 페칭 (병렬 처리)
 */
export async function fetchLawyerDashboardData(
  userId: string
): Promise<LawyerDashboardData> {
  const supabase = createClient();

  // 병렬 페칭
  const [casesResult, ratingsResult, performanceResult] = await Promise.all([
    // 배정 사건
    supabase
      .from('matches')
      .select('report:reports(id, title, severity), created_at')
      .eq('lawyer_id', userId)
      .eq('status', 'matched'),

    // 평가 점수
    supabase
      .from('reviews')
      .select('rating')
      .eq('lawyer_id', userId),

    // 실적 통계
    supabase
      .from('consultations')
      .select('completed_at, status')
      .eq('lawyer_id', userId)
      .gte('completed_at', getOneYearAgo()),
  ]);

  const ratings = ratingsResult.data || [];
  const consultations = performanceResult.data || [];

  return {
    assignedCases:
      casesResult.data?.map((m: any) => ({
        id: m.report.id,
        title: m.report.title,
        severity: m.report.severity,
        assigned_at: m.created_at,
      })) || [],
    rating: {
      average: calculateAverage(ratings.map((r) => r.rating)),
      count: ratings.length,
    },
    performance: {
      monthlyCases: groupByMonth(consultations),
      completionRate: calculateCompletionRate(consultations),
    },
  };
}

/**
 * 차트 데이터 변환 (메모이제이션 가능)
 */
export function transformChartData(
  rawData: Array<{ month: string; count: number }>
): ChartDataPoint[] {
  if (!rawData || rawData.length === 0) {
    return [];
  }

  return rawData.map((item) => ({
    name: formatMonthName(item.month),
    value: item.count,
  }));
}

// Helper functions

function calculateAvgProcessingTime(
  reports: Array<{ created_at: string; updated_at?: string }>
): number {
  const completed = reports.filter((r) => r.updated_at);
  if (completed.length === 0) return 0;

  const total = completed.reduce((sum, r) => {
    const start = new Date(r.created_at).getTime();
    const end = new Date(r.updated_at!).getTime();
    return sum + (end - start);
  }, 0);

  return total / completed.length / (1000 * 60 * 60 * 24); // days
}

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function calculateCompletionRate(
  consultations: Array<{ status: string }>
): number {
  if (consultations.length === 0) return 0;
  const completed = consultations.filter((c) => c.status === 'completed').length;
  return (completed / consultations.length) * 100;
}

function groupByMonth(
  consultations: Array<{ completed_at: string }>
): Array<{ month: string; count: number }> {
  const groups: Record<string, number> = {};

  consultations.forEach((c) => {
    const month = c.completed_at.substring(0, 7); // YYYY-MM
    groups[month] = (groups[month] || 0) + 1;
  });

  return Object.entries(groups)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12);
}

function formatMonthName(month: string): string {
  const date = new Date(month + '-01');
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  return monthNames[date.getMonth()];
}

function getOneYearAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}
