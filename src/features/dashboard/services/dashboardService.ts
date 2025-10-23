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
 * 변호사 대시보드 데이터 타입 (SPEC-DASHBOARD-LAWYER-001)
 */
export interface LawyerCaseStats {
  pending: number;
  inProgress: number;
  completed: number;
}

export interface LawyerCase {
  id: string;
  caseId: string;
  teacherName: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  category: string;
}

export interface LawyerConsultation {
  id: string;
  reportId: string;
  teacherName: string;
  status: 'pending' | 'active' | 'completed';
  satisfactionScore: number | null;
  createdAt: string;
}

export interface LawyerDashboardStats {
  totalCases: number;
  avgProcessingTime: number;
  avgRating: number;
}

export interface LawyerDashboardData {
  cases: {
    stats: LawyerCaseStats;
    recent: LawyerCase[];
  };
  consultations: {
    recent: LawyerConsultation[];
  };
  stats: LawyerDashboardStats;
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
 * @CODE:DASHBOARD-LAWYER-001 | SPEC: SPEC-DASHBOARD-LAWYER-001.md | TEST: tests/features/dashboard/services/dashboardService.test.ts
 *
 * SPEC 요구사항:
 * - reports 테이블: assigned_lawyer_id = userId 필터 (교사가 아닌 변호사 배정 기준)
 * - consultations 테이블: lawyer_id = userId 필터
 * - 병렬 페칭으로 성능 최적화
 * - 최근 5개 사건만 조회 (SPEC 제약사항)
 */
export async function fetchLawyerDashboardData(
  userId: string
): Promise<LawyerDashboardData> {
  const supabase = createClient();

  try {
    // 병렬 페칭 (성능 최적화)
    const [casesResult, consultationsResult, statsResult] = await Promise.all([
      // 1. 배정된 사건 조회 (최근 5개)
      supabase
        .from('reports')
        .select(`
          id,
          title,
          category,
          status,
          created_at,
          teacher:users!reports_teacher_id_fkey(name)
        `)
        .eq('assigned_lawyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),

      // 2. 상담 이력 조회 (최근 3개)
      supabase
        .from('consultations')
        .select(`
          id,
          status,
          satisfaction_score,
          created_at,
          report:reports(title),
          teacher:users!consultations_teacher_id_fkey(name)
        `)
        .eq('lawyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),

      // 3. 통계용 전체 사건 조회
      supabase
        .from('reports')
        .select('id, created_at, updated_at, status')
        .eq('assigned_lawyer_id', userId),
    ]);

    // 에러 체크
    if (casesResult.error) {
      throw new Error(`사건 데이터 조회 실패: ${casesResult.error.message}`);
    }
    if (consultationsResult.error) {
      throw new Error(`상담 데이터 조회 실패: ${consultationsResult.error.message}`);
    }
    if (statsResult.error) {
      throw new Error(`통계 데이터 조회 실패: ${statsResult.error.message}`);
    }

    const cases = casesResult.data || [];
    const consultations = consultationsResult.data || [];
    const allCases = statsResult.data || [];

    // 사건 상태별 카운트
    const caseStats: LawyerCaseStats = {
      pending: cases.filter((c) => c.status === 'pending').length,
      inProgress: cases.filter((c) => c.status === 'in_progress').length,
      completed: cases.filter((c) => c.status === 'completed').length,
    };

    // 평균 처리 시간 계산 (분 단위)
    const completedCases = allCases.filter(
      (c) => c.status === 'completed' && c.updated_at
    );
    const avgProcessingTime =
      completedCases.length > 0
        ? Math.round(
            completedCases.reduce((sum, c) => {
              const createdDate = new Date(c.created_at).getTime();
              const updatedDate = new Date(c.updated_at!).getTime();
              return sum + (updatedDate - createdDate);
            }, 0) /
              completedCases.length /
              (1000 * 60) // minutes
          )
        : 0;

    // 평균 평점 계산 (consultations.satisfaction_score 기반)
    const avgRating =
      consultations.length > 0
        ? Math.round(
            (consultations.reduce(
              (sum, c) => sum + (c.satisfaction_score || 0),
              0
            ) /
              consultations.length) *
              10
          ) / 10
        : 0;

    return {
      cases: {
        stats: caseStats,
        recent: cases.map((c) => ({
          id: c.id,
          caseId: c.title,
          teacherName: c.teacher?.name || '알 수 없음',
          status: c.status as 'pending' | 'in_progress' | 'completed',
          createdAt: c.created_at,
          category: c.category,
        })),
      },
      consultations: {
        recent: consultations.map((c) => ({
          id: c.id,
          reportId: c.report?.title || '알 수 없음',
          teacherName: c.teacher?.name || '알 수 없음',
          status: c.status as 'pending' | 'active' | 'completed',
          satisfactionScore: c.satisfaction_score,
          createdAt: c.created_at,
        })),
      },
      stats: {
        totalCases: allCases.length,
        avgProcessingTime,
        avgRating,
      },
    };
  } catch (error) {
    console.error('[fetchLawyerDashboardData] Error:', error);
    throw error;
  }
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
