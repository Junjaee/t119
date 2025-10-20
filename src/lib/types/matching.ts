// @CODE:MATCH-001:DATA | SPEC: .moai/specs/SPEC-MATCH-001/spec.md
// 변호사 주도 매칭 시스템 타입 정의

import { ReportCategory } from '@/types/report.types';

/**
 * 미배정 신고 항목
 */
export interface AvailableReport {
  id: string;
  title: string;
  category: ReportCategory;
  incident_date: string;
  created_at: string;
  teacher: {
    name: string;
    anonymous_nickname: string;
  };
}

/**
 * 미배정 신고 목록 조회 쿼리
 */
export interface AvailableReportsQuery {
  category?: ReportCategory | string;
  sort?: 'created_at' | 'incident_date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * 미배정 신고 목록 조회 응답
 */
export interface AvailableReportsResponse {
  reports: AvailableReport[];
  pagination: PaginationInfo;
}

/**
 * 상담 시작 요청
 */
export interface CreateConsultationRequest {
  report_id: string;
}

/**
 * 상담 상태
 */
export enum ConsultationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 상담 엔티티
 */
export interface Consultation {
  id: string;
  report_id: string;
  teacher_id: string;
  lawyer_id: string;
  status: ConsultationStatus;
  satisfaction_score?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 상담 시작 응답
 */
export interface CreateConsultationResponse {
  consultation: {
    id: string;
    report_id: string;
    teacher_id: string;
    lawyer_id: string;
    status: ConsultationStatus;
    created_at: string;
  };
  report: {
    id: string;
    status: string;
    assigned_lawyer_id: string;
  };
}
