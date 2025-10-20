// @CODE:REPORT-001:DATA | SPEC: .moai/specs/SPEC-REPORT-001/spec.md | TEST: tests/lib/validators/report.validator.test.ts
// 신고 시스템 타입 정의

/**
 * 신고 카테고리
 */
export enum ReportCategory {
  PARENT = 'parent',
  STUDENT = 'student',
  COLLEAGUE = 'colleague',
}

/**
 * 신고 상태
 */
export enum ReportStatus {
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

/**
 * 신고 우선순위
 */
export enum ReportPriority {
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 신고 생성 입력
 */
export interface CreateReportInput {
  category: ReportCategory;
  sub_category: string;
  title: string;
  description: string;
  incident_date: string;
  incident_location?: string;
  perpetrator_type?: string;
  priority: ReportPriority;
}

/**
 * 신고 업데이트 입력
 */
export interface UpdateReportInput {
  title?: string;
  description?: string;
  status?: ReportStatus;
  assigned_lawyer_id?: string;
  incident_location?: string;
  perpetrator_type?: string;
  priority?: ReportPriority;
}

/**
 * 신고 엔티티
 */
export interface Report {
  id: string;
  user_id: string;
  category: ReportCategory;
  sub_category: string;
  title: string;
  description: string;
  incident_date: string;
  incident_location?: string;
  perpetrator_type?: string;
  status: ReportStatus;
  priority: ReportPriority;
  assigned_lawyer_id?: string;
  assigned_at?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
}

/**
 * 신고 파일
 */
export interface ReportFile {
  id: string;
  report_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

/**
 * 신고 상태 변경 이력
 */
export interface ReportStatusHistory {
  id: string;
  report_id: string;
  from_status: ReportStatus;
  to_status: ReportStatus;
  changed_by: string;
  notes?: string;
  created_at: string;
}

/**
 * 신고 목록 쿼리 파라미터
 */
export interface ReportQueryParams {
  status?: ReportStatus;
  priority?: ReportPriority;
  category?: ReportCategory;
  page?: number;
  limit?: number;
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 신고 목록 응답
 */
export interface ReportListResponse {
  data: Report[];
  pagination: PaginationMeta;
}

/**
 * 신고 상세 응답
 */
export interface ReportDetailResponse {
  report: Report;
  files: ReportFile[];
  statusHistory: ReportStatusHistory[];
}
