// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/lib/stats/stats-service.test.ts
// TAG-002: Stats Service Layer

import { createClient } from '@/lib/supabase/client';
import { maskName } from '@/lib/auth/anonymize';
import type {
  StatsOverview,
  TrendData,
  ConsultationStats,
  StatsFilters,
  TypeStats,
  RegionStats,
  SchoolLevelStats,
} from '@/types/stats.types';

/**
 * Validate date range filters
 * @param filters - Optional date range filters
 * @throws Error if date range is invalid
 */
export function validateDateRange(filters: StatsFilters): void {
  if (!filters.start_date || !filters.end_date) {
    return;
  }

  const startDate = new Date(filters.start_date);
  const endDate = new Date(filters.end_date);

  if (endDate < startDate) {
    throw new Error('end_date must be after start_date');
  }

  const monthsDiff =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  if (monthsDiff > 12) {
    throw new Error('Date range cannot exceed 12 months');
  }
}

/**
 * Get default date range (last 12 months)
 */
function getDefaultDateRange(): { start_date: string; end_date: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  };
}

/**
 * Fetch overview statistics
 * @param filters - Optional filters (date range)
 * @returns Overview statistics with breakdown by type, region, and school level
 */
export async function fetchOverviewStats(
  filters: StatsFilters = {}
): Promise<StatsOverview> {
  validateDateRange(filters);

  const dateRange = filters.start_date
    ? filters
    : getDefaultDateRange();
  const supabase = createClient();

  // Fetch aggregated stats from report_stats view
  const { data: reportStats, error: reportError } = await supabase
    .from('report_stats')
    .select('*')
    .gte('month', dateRange.start_date)
    .lte('month', dateRange.end_date);

  if (reportError) {
    console.error('Error fetching report stats:', reportError);
    return getEmptyOverview();
  }

  // Fetch consultation stats
  const { data: consultationData, error: consultationError } = await supabase
    .from('consultation_stats')
    .select('*')
    .gte('month', dateRange.start_date)
    .lte('month', dateRange.end_date);

  if (consultationError) {
    console.error('Error fetching consultation stats:', consultationError);
  }

  // Calculate overview totals
  const totalReports = reportStats?.reduce(
    (sum, row) => sum + (row.report_count || 0),
    0
  ) || 0;

  const consultationSummary = consultationData?.[0] || {
    total_consultations: 0,
    completed_count: 0,
    completion_rate: 0,
    avg_processing_days: 0,
  };

  const activeConsultations =
    (consultationSummary.total_consultations || 0) -
    (consultationSummary.completed_count || 0);

  // Aggregate by type
  const typeMap = new Map<string, number>();
  reportStats?.forEach((row) => {
    const current = typeMap.get(row.type) || 0;
    typeMap.set(row.type, current + (row.report_count || 0));
  });

  const byType: TypeStats[] = Array.from(typeMap.entries()).map(
    ([type, count]) => ({
      type,
      count,
      percentage:
        totalReports > 0 ? Math.round((count / totalReports) * 100 * 100) / 100 : 0,
      month_over_month_change: 0, // Calculated separately if needed
    })
  );

  // Aggregate by region
  const regionMap = new Map<string, number>();
  reportStats?.forEach((row) => {
    const current = regionMap.get(row.region) || 0;
    regionMap.set(row.region, current + (row.report_count || 0));
  });

  const byRegion: RegionStats[] = Array.from(regionMap.entries()).map(
    ([region, count]) => ({
      region,
      count,
      percentage:
        totalReports > 0 ? Math.round((count / totalReports) * 100 * 100) / 100 : 0,
    })
  );

  // Aggregate by school level
  const schoolMap = new Map<string, number>();
  reportStats?.forEach((row) => {
    const current = schoolMap.get(row.school_level) || 0;
    schoolMap.set(row.school_level, current + (row.report_count || 0));
  });

  const bySchoolLevel: SchoolLevelStats[] = Array.from(
    schoolMap.entries()
  ).map(([level, count]) => ({
    level,
    count,
    percentage:
      totalReports > 0 ? Math.round((count / totalReports) * 100 * 100) / 100 : 0,
  }));

  return {
    overview: {
      total_reports: totalReports,
      active_consultations: activeConsultations,
      completion_rate: consultationSummary.completion_rate || 0,
      avg_processing_days: consultationSummary.avg_processing_days || 0,
    },
    by_type: byType,
    by_region: byRegion,
    by_school_level: bySchoolLevel,
  };
}

/**
 * Get empty overview structure
 */
function getEmptyOverview(): StatsOverview {
  return {
    overview: {
      total_reports: 0,
      active_consultations: 0,
      completion_rate: 0,
      avg_processing_days: 0,
    },
    by_type: [],
    by_region: [],
    by_school_level: [],
  };
}

/**
 * Fetch monthly trends data
 * @param filters - Optional filters (date range, type, region)
 * @returns Monthly trends with MoM changes
 */
export async function fetchTrendsData(
  filters: StatsFilters = {}
): Promise<{ trends: TrendData[] }> {
  validateDateRange(filters);

  const dateRange = filters.start_date
    ? filters
    : getDefaultDateRange();
  const supabase = createClient();

  let query = supabase
    .from('monthly_trends')
    .select('*')
    .gte('month', dateRange.start_date)
    .lte('month', dateRange.end_date)
    .order('month', { ascending: false })
    .limit(12);

  const { data: trendsData, error: trendsError } = await query;

  if (trendsError) {
    console.error('Error fetching trends:', trendsError);
    return { trends: [] };
  }

  // Fetch consultation data for the same period
  const { data: consultationData } = await supabase
    .from('consultation_stats')
    .select('*')
    .gte('month', dateRange.start_date)
    .lte('month', dateRange.end_date)
    .order('month', { ascending: false });

  // Merge data
  const consultationMap = new Map(
    consultationData?.map((row) => [row.month, row]) || []
  );

  const trends: TrendData[] =
    trendsData?.map((row) => {
      const consultation = consultationMap.get(row.month) || {};
      return {
        month: row.month,
        report_count: row.report_count || 0,
        consultation_count: consultation.total_consultations || 0,
        completion_rate: consultation.completion_rate || 0,
        avg_satisfaction: consultation.avg_satisfaction || 0,
        month_over_month_change: row.month_over_month_change || 0,
      };
    }) || [];

  return { trends };
}

/**
 * Fetch consultation statistics
 * @returns Consultation performance metrics and counselor stats
 */
export async function fetchConsultationStats(): Promise<ConsultationStats> {
  const supabase = createClient();

  // Fetch overall performance
  const { data: performanceData, error: performanceError } = await supabase
    .from('consultation_stats')
    .select('*')
    .order('month', { ascending: false })
    .limit(1);

  if (performanceError) {
    console.error('Error fetching consultation performance:', performanceError);
    return getEmptyConsultationStats();
  }

  const performance = performanceData?.[0] || {
    total_consultations: 0,
    completed_count: 0,
    completion_rate: 0,
    avg_processing_days: 0,
    avg_satisfaction: 0,
  };

  // Fetch counselor-specific stats (with PII masking)
  const { data: counselorData, error: counselorError } = await supabase
    .from('consultations')
    .select('counselor_id, status, satisfaction_score')
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

  if (counselorError) {
    console.error('Error fetching counselor stats:', counselorError);
  }

  // Aggregate by counselor
  const counselorMap = new Map<
    string,
    {
      total: number;
      completed: number;
      satisfaction_sum: number;
      satisfaction_count: number;
    }
  >();

  counselorData?.forEach((row) => {
    const stats = counselorMap.get(row.counselor_id) || {
      total: 0,
      completed: 0,
      satisfaction_sum: 0,
      satisfaction_count: 0,
    };

    stats.total++;
    if (row.status === 'completed') {
      stats.completed++;
    }
    if (row.satisfaction_score) {
      stats.satisfaction_sum += row.satisfaction_score;
      stats.satisfaction_count++;
    }

    counselorMap.set(row.counselor_id, stats);
  });

  const byCounselor = Array.from(counselorMap.entries()).map(
    ([counselorId, stats]) => ({
      counselor_id: counselorId,
      counselor_name: maskName(`상담사${counselorId.slice(-4)}`),
      consultation_count: stats.total,
      completion_rate:
        stats.total > 0
          ? Math.round((stats.completed / stats.total) * 100 * 100) / 100
          : 0,
      avg_satisfaction:
        stats.satisfaction_count > 0
          ? Math.round(
              (stats.satisfaction_sum / stats.satisfaction_count) * 100
            ) / 100
          : 0,
    })
  );

  return {
    performance: {
      total_consultations: performance.total_consultations,
      completed_count: performance.completed_count,
      completion_rate: performance.completion_rate,
      avg_processing_days: performance.avg_processing_days,
      avg_satisfaction: performance.avg_satisfaction,
    },
    by_counselor: byCounselor,
  };
}

/**
 * Get empty consultation stats structure
 */
function getEmptyConsultationStats(): ConsultationStats {
  return {
    performance: {
      total_consultations: 0,
      completed_count: 0,
      completion_rate: 0,
      avg_processing_days: 0,
      avg_satisfaction: 0,
    },
    by_counselor: [],
  };
}
