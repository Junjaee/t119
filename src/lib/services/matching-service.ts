// @CODE:MATCH-001:DOMAIN | SPEC: .moai/specs/SPEC-MATCH-001/spec.md | TEST: tests/lib/services/matching-service.test.ts
// 변호사 주도 매칭 시스템 서비스 레이어

import { createClient } from '@/lib/supabase/server';
import {
  AvailableReport,
  AvailableReportsQuery,
  AvailableReportsResponse,
  CreateConsultationRequest,
  CreateConsultationResponse,
  ConsultationStatus,
} from '@/lib/types/matching';
import { ReportStatus } from '@/types/report.types';

/**
 * 변호사 주도 매칭 서비스
 */
export class MatchingService {
  /**
   * 미배정 신고 목록 조회
   * @param query - 쿼리 파라미터 (카테고리, 정렬, 페이지네이션)
   * @returns 미배정 신고 목록 및 페이지네이션 정보
   */
  async getAvailableReports(
    query: AvailableReportsQuery
  ): Promise<AvailableReportsResponse> {
    const supabase = await createClient();

    const {
      category,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 기본 쿼리 빌더
    let queryBuilder = supabase
      .from('reports')
      .select(
        `
        id,
        title,
        category,
        incident_date,
        created_at,
        user_id,
        users!reports_user_id_fkey (
          name,
          nickname
        )
      `,
        { count: 'exact' }
      )
      .eq('status', ReportStatus.SUBMITTED)
      .is('assigned_lawyer_id', null);

    // 카테고리 필터링
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 정렬
    if (sort && order) {
      queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc' });
    }

    // 페이지네이션
    const { data, count, error } = await queryBuilder.range(from, to);

    if (error) {
      throw new Error(`Failed to fetch available reports: ${error.message}`);
    }

    // 데이터 변환
    const reports: AvailableReport[] = (data || []).map((report: any) => ({
      id: report.id,
      title: report.title,
      category: report.category,
      incident_date: report.incident_date,
      created_at: report.created_at,
      teacher: {
        name: report.users?.name || 'Unknown',
        anonymous_nickname: report.users?.nickname || 'Anonymous',
      },
    }));

    const total = count || 0;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      reports,
      pagination: {
        total,
        page,
        limit,
        total_pages: totalPages,
      },
    };
  }

  /**
   * 신고 선택 및 상담 시작
   * @param lawyerId - 변호사 ID
   * @param request - 신고 ID
   * @returns 생성된 상담 및 업데이트된 신고 정보
   * @throws 이미 배정된 신고, 존재하지 않는 신고, 진행 중인 상담 10개 초과
   */
  async selectReport(
    lawyerId: string,
    request: CreateConsultationRequest
  ): Promise<CreateConsultationResponse> {
    const supabase = await createClient();
    const { report_id } = request;

    // 1. 변호사의 진행 중인 상담 수 확인
    const { count: activeConsultationsCount } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('lawyer_id', lawyerId)
      .eq('status', ConsultationStatus.ACTIVE);

    if (activeConsultationsCount && activeConsultationsCount >= 10) {
      throw new Error('Too many active consultations');
    }

    // 2. 신고 조회 및 검증
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // 3. 신고 상태 검증 (순서 중요: 배정 여부 먼저 확인)
    if (report.assigned_lawyer_id !== null) {
      throw new Error('Report already assigned');
    }

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new Error('Report is not available');
    }

    // 4. 신고 업데이트 (상태 전환: submitted → assigned)
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: ReportStatus.ASSIGNED,
        assigned_lawyer_id: lawyerId,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', report_id)
      .select()
      .single();

    if (updateError || !updatedReport) {
      throw new Error(`Failed to update report: ${updateError?.message}`);
    }

    // 5. 상담 생성
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .insert({
        report_id,
        teacher_id: report.user_id,
        lawyer_id: lawyerId,
        status: ConsultationStatus.PENDING,
      })
      .select()
      .single();

    if (consultationError || !consultation) {
      // 롤백: 신고 상태 원복
      await supabase
        .from('reports')
        .update({
          status: ReportStatus.SUBMITTED,
          assigned_lawyer_id: null,
          assigned_at: null,
        })
        .eq('id', report_id);

      throw new Error(
        `Failed to create consultation: ${consultationError?.message}`
      );
    }

    // 6. 응답 반환
    return {
      consultation: {
        id: consultation.id,
        report_id: consultation.report_id,
        teacher_id: consultation.teacher_id,
        lawyer_id: consultation.lawyer_id,
        status: consultation.status as ConsultationStatus,
        created_at: consultation.created_at,
      },
      report: {
        id: updatedReport.id,
        status: updatedReport.status as string,
        assigned_lawyer_id: updatedReport.assigned_lawyer_id,
      },
    };
  }
}
