// @CODE:REPORT-001 | SPEC: .moai/specs/SPEC-REPORT-001/spec.md
// 신고 서비스 (Supabase CRUD)

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type {
  CreateReportInput,
  UpdateReportInput,
  Report,
  ReportListResponse,
  ReportDetailResponse,
  ReportQueryParams,
} from '@/types/report.types';
import { maskPII } from './pii-masking';

type ReportRow = Database['public']['Tables']['reports']['Row'];

/**
 * 신고 생성
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID
 * @param input - 신고 입력 데이터
 * @returns 생성된 신고
 */
export async function createReport(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateReportInput
): Promise<Report> {
  // PII 자동 마스킹
  const maskedDescription = maskPII(input.description);
  const maskedTitle = maskPII(input.title);

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      category: input.category,
      sub_category: input.sub_category,
      title: maskedTitle,
      description: maskedDescription,
      incident_date: input.incident_date,
      incident_location: input.incident_location,
      perpetrator_type: input.perpetrator_type,
      priority: input.priority,
      status: 'submitted',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create report: ${error.message}`);

  return data as Report;
}

/**
 * 신고 목록 조회
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID
 * @param params - 쿼리 파라미터
 * @returns 신고 목록 및 페이지네이션 정보
 */
export async function getReports(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: ReportQueryParams = {}
): Promise<ReportListResponse> {
  const { status, priority, category, page = 1, limit = 10 } = params;

  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (category) query = query.eq('category', category);

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to fetch reports: ${error.message}`);

  return {
    data: (data || []) as Report[],
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * 신고 상세 조회
 * @param supabase - Supabase 클라이언트
 * @param reportId - 신고 ID
 * @param userId - 사용자 ID
 * @returns 신고 상세 정보
 */
export async function getReportById(
  supabase: SupabaseClient<Database>,
  reportId: string,
  userId: string
): Promise<ReportDetailResponse> {
  // 신고 조회
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();

  if (reportError) throw new Error(`Failed to fetch report: ${reportError.message}`);

  // 파일 목록 조회
  const { data: files, error: filesError } = await supabase
    .from('evidence_files')
    .select('*')
    .eq('report_id', reportId);

  if (filesError) throw new Error(`Failed to fetch files: ${filesError.message}`);

  return {
    report: report as Report,
    files: files || [],
    statusHistory: [], // 상태 이력은 추후 구현
  };
}

/**
 * 신고 업데이트
 * @param supabase - Supabase 클라이언트
 * @param reportId - 신고 ID
 * @param userId - 사용자 ID
 * @param input - 업데이트 데이터
 * @returns 업데이트된 신고
 */
export async function updateReport(
  supabase: SupabaseClient<Database>,
  reportId: string,
  userId: string,
  input: UpdateReportInput
): Promise<Report> {
  // PII 마스킹 (description, title이 있을 경우)
  const updates: Partial<ReportRow> = {};

  if (input.title) updates.title = maskPII(input.title);
  if (input.description) updates.description = maskPII(input.description);
  if (input.status) updates.status = input.status;
  if (input.assigned_lawyer_id) updates.assigned_lawyer_id = input.assigned_lawyer_id;
  if (input.incident_location) updates.incident_location = input.incident_location;
  if (input.perpetrator_type) updates.perpetrator_type = input.perpetrator_type;
  if (input.priority) updates.priority = input.priority;

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update report: ${error.message}`);

  return data as Report;
}

/**
 * 신고 삭제 (submitted 상태에서만 가능)
 * @param supabase - Supabase 클라이언트
 * @param reportId - 신고 ID
 * @param userId - 사용자 ID
 */
export async function deleteReport(
  supabase: SupabaseClient<Database>,
  reportId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)
    .eq('user_id', userId)
    .eq('status', 'submitted');

  if (error) throw new Error(`Failed to delete report: ${error.message}`);
}
