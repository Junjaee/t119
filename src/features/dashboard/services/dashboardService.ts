// @CODE:DASHBOARD-001:DASHBOARD-PAGES | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/features/dashboard/services/dashboardService.test.ts
// 대시보드 데이터 페칭 서비스 (역할별)

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
 * 관리자 대시보드 데이터 타입
 */
export interface AdminDashboardData {
  systemStats: {
    totalUsers: number;
    totalReports: number;
    totalMatches: number;
  };
  userManagement: {
    newUsers: number;
    activeUsers: number;
  };
  systemMonitoring: {
    avgResponseTime: number;
    errorCount: number;
  };
  matchingStatus: {
    pendingMatches: number;
    avgMatchTime: number;
    successRate: number;
  };
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
      avgRating: 4.5, // Mock value (실제로는 reviews 테이블 조인)
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
    supabase.from('reviews').select('rating').eq('lawyer_id', userId),

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
 * 관리자 대시보드 데이터 페칭 (병렬 처리)
 * @TEST:DASHBOARD-001 - 전체 통계, 신규 가입, 매칭 현황
 */
export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createClient();

  // 병렬 페칭
  const [usersResult, reportsResult, matchesResult, newUsersResult] =
    await Promise.all([
      // 전체 사용자 통계
      supabase
        .from('users')
        .select('role')
        .in('role', ['teacher', 'lawyer']),

      // 신고 통계
      supabase.from('reports').select('id', { count: 'exact' }),

      // 매칭 통계
      supabase
        .from('matches')
        .select('status, created_at, matched_at'),

      // 신규 가입 사용자 (최근 7일)
      supabase
        .from('users')
        .select('role')
        .gte('created_at', getSevenDaysAgo()),
    ]);

  const users = usersResult.data || [];
  const matches = matchesResult.data || [];
  const newUsers = newUsersResult.data || [];

  const teacherCount = users.filter((u) => u.role === 'teacher').length;
  const lawyerCount = users.filter((u) => u.role === 'lawyer').length;

  return {
    systemStats: {
      totalUsers: teacherCount + lawyerCount,
      totalReports: reportsResult.count || 0,
      totalMatches: matches.length,
    },
    userManagement: {
      newUsers: newUsers.length,
      activeUsers: Math.floor(users.length * 0.65), // Mock (실제로는 last_login 기반)
    },
    systemMonitoring: {
      avgResponseTime: 250, // Mock (실제로는 로그 분석)
      errorCount: 3, // Mock (실제로는 에러 로그)
    },
    matchingStatus: {
      pendingMatches: matches.filter((m) => m.status === 'pending').length,
      avgMatchTime: calculateAvgMatchTime(matches),
      successRate: calculateMatchSuccessRate(matches),
    },
  };
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

function calculateAvgMatchTime(
  matches: Array<{ status: string; created_at: string; matched_at?: string }>
): number {
  const matched = matches.filter((m) => m.status === 'matched' && m.matched_at);
  if (matched.length === 0) return 0;

  const total = matched.reduce((sum, m) => {
    const start = new Date(m.created_at).getTime();
    const end = new Date(m.matched_at!).getTime();
    return sum + (end - start);
  }, 0);

  return total / matched.length / (1000 * 60 * 60 * 24); // days
}

function calculateMatchSuccessRate(
  matches: Array<{ status: string }>
): number {
  if (matches.length === 0) return 0;
  const matched = matches.filter((m) => m.status === 'matched').length;
  return (matched / matches.length) * 100;
}

function getOneYearAgo(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}

function getSevenDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
}
