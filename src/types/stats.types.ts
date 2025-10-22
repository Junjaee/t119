// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// Statistics Type Definitions

export interface OverviewStats {
  total_reports: number;
  active_consultations: number;
  completion_rate: number;
  avg_processing_days: number;
}

export interface TypeStats {
  type: string;
  count: number;
  percentage: number;
  month_over_month_change: number;
}

export interface RegionStats {
  region: string;
  count: number;
  percentage: number;
}

export interface SchoolLevelStats {
  level: string;
  count: number;
  percentage: number;
}

export interface StatsOverview {
  overview: OverviewStats;
  by_type: TypeStats[];
  by_region: RegionStats[];
  by_school_level: SchoolLevelStats[];
}

export interface TrendData {
  month: string;
  report_count: number;
  consultation_count: number;
  completion_rate: number;
  avg_satisfaction: number;
  month_over_month_change: number;
}

export interface ConsultationPerformance {
  total_consultations: number;
  completed_count: number;
  completion_rate: number;
  avg_processing_days: number;
  avg_satisfaction: number;
}

export interface CounselorStats {
  counselor_id: string;
  counselor_name: string;
  consultation_count: number;
  completion_rate: number;
  avg_satisfaction: number;
}

export interface ConsultationStats {
  performance: ConsultationPerformance;
  by_counselor: CounselorStats[];
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface StatsFilters extends Partial<DateRange> {
  type?: string;
  region?: string;
}
