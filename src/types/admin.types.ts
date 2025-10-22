// @CODE:ADMIN-001:DATA | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/types/admin.types.test.ts

/**
 * Admin Management System Types
 *
 * @description
 * Type definitions for admin association management, user approvals, and audit logging.
 *
 * @spec SPEC-ADMIN-001
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

/**
 * Association (협회)
 * Admin-managed association entity
 */
export interface Association {
  id: string; // UUID
  name: string; // 협회명 (2~50자, unique)
  region: string; // 지역 (17개 시도)
  description: string; // 설명 (최대 500자)
  logo_url?: string; // 로고 이미지 URL (optional)
  is_public: boolean; // 공개 여부 (default: true)
  is_deleted: boolean; // 삭제 여부 (default: false)
  created_by: string; // 생성자 ID (FK: users.id)
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * AssociationMember (협회 회원)
 * Association membership relationship
 */
export interface AssociationMember {
  id: string; // UUID
  association_id: string; // 협회 ID (FK: associations.id)
  user_id: string; // 사용자 ID (FK: users.id)
  role: 'admin' | 'member'; // 역할 (default: 'member')
  joined_at: string; // ISO 8601
}

/**
 * UserApproval (사용자 승인)
 * User approval queue entity
 */
export interface UserApproval {
  id: string; // UUID
  user_id: string; // 신청자 ID (FK: users.id)
  association_id?: string; // 가입 희망 협회 ID (optional)
  status: 'pending' | 'approved' | 'rejected'; // 상태 (default: 'pending')
  reason: string; // 가입 사유 (1~200자)
  rejected_reason?: string; // 거부 사유 (optional)
  approved_by?: string; // 승인자 ID (FK: users.id, optional)
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * AuditLog (감사 로그)
 * Admin action audit log entity
 */
export interface AuditLog {
  id: string; // UUID
  user_id: string; // 작업 수행자 ID (FK: users.id)
  action: string; // 작업 유형 (예: 'association_created', 'user_approved')
  resource_type: string; // 리소스 유형 (예: 'association', 'user')
  resource_id: string; // 리소스 ID
  changes?: Record<string, any>; // 변경 내용 (JSON)
  ip_address: string; // IP 주소
  user_agent: string; // User-Agent
  created_at: string; // ISO 8601
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * CreateAssociationDTO
 * DTO for creating a new association
 */
export interface CreateAssociationDTO {
  name: string; // 2~50자, unique
  region: string; // 17개 시도
  description: string; // 최대 500자
  logo_url?: string; // optional, max 2MB
}

/**
 * UpdateAssociationDTO
 * DTO for updating an association
 */
export interface UpdateAssociationDTO {
  name?: string;
  description?: string;
  is_public?: boolean;
}

/**
 * CreateApprovalDTO
 * DTO for creating a user approval request
 */
export interface CreateApprovalDTO {
  user_id: string;
  association_id?: string;
  reason: string; // 1~200자
}

/**
 * ApproveUserDTO
 * DTO for approving a user
 */
export interface ApproveUserDTO {
  // Empty object - approval is by ID
}

/**
 * RejectUserDTO
 * DTO for rejecting a user
 */
export interface RejectUserDTO {
  reason: string; // 거부 사유 (1~200자)
}

/**
 * CreateAuditLogDTO
 * DTO for creating an audit log
 */
export interface CreateAuditLogDTO {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: Record<string, any>;
  ip_address: string;
  user_agent: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

/**
 * DashboardStats
 * Overview statistics for admin dashboard
 */
export interface DashboardStats {
  total_users: number;
  total_reports: number;
  total_consultations: number;
  pending_approvals: number;
}

/**
 * DashboardActivity
 * Recent activity item
 */
export interface DashboardActivity {
  action: string;
  user_name: string;
  created_at: string; // ISO 8601
}

/**
 * DashboardAlert
 * Alert notification for admins
 */
export interface DashboardAlert {
  type: 'spam' | 'abnormal_login' | 'high_report_count';
  message: string;
  created_at: string; // ISO 8601
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * PaginationParams
 * Common pagination parameters
 */
export interface PaginationParams {
  page: number; // default: 1
  limit: number; // default: 20
}

/**
 * PaginationResponse
 * Common pagination response metadata
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * AssociationListFilters
 * Filters for association list query
 */
export interface AssociationListFilters extends PaginationParams {
  region?: string; // optional: 지역 필터
  is_deleted?: boolean; // optional: 삭제된 협회 포함 여부
}

/**
 * ApprovalListFilters
 * Filters for approval list query
 */
export interface ApprovalListFilters extends PaginationParams {
  status?: 'pending' | 'approved' | 'rejected'; // default: 'pending'
}

/**
 * AuditLogFilters
 * Filters for audit log query
 */
export interface AuditLogFilters extends PaginationParams {
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  action?: string; // optional: 작업 유형 필터
  user_id?: string; // optional: 사용자 필터
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * AssociationListResponse
 * Response for GET /api/admin/associations
 */
export interface AssociationListResponse {
  associations: Association[];
  pagination: PaginationResponse;
}

/**
 * ApprovalListResponse
 * Response for GET /api/admin/approvals
 */
export interface ApprovalListResponse {
  approvals: Array<
    UserApproval & {
      user: {
        id: string;
        name: string;
        email: string;
      };
      association?: {
        id: string;
        name: string;
      };
    }
  >;
  pagination: PaginationResponse;
}

/**
 * AuditLogListResponse
 * Response for GET /api/admin/audit-logs
 */
export interface AuditLogListResponse {
  logs: AuditLog[];
  pagination: PaginationResponse;
}

/**
 * DashboardResponse
 * Response for GET /api/admin/dashboard
 */
export interface DashboardResponse {
  overview: DashboardStats;
  recent_activities: DashboardActivity[];
  alerts: DashboardAlert[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Korean Regions (17개 시도)
 */
export const KOREAN_REGIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
] as const;

export type KoreanRegion = (typeof KOREAN_REGIONS)[number];

/**
 * Approval Status
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Association Member Role
 */
export type MemberRole = 'admin' | 'member';

/**
 * Alert Type
 */
export type AlertType = 'spam' | 'abnormal_login' | 'high_report_count';
