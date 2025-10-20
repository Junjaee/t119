// @CODE:REPORT-001 | SPEC: .moai/specs/SPEC-REPORT-001/spec.md | TEST: tests/lib/validators/report.validator.test.ts
// 신고 검증 스키마 (Zod)

import { z } from 'zod';

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
 * 신고 생성 스키마
 */
export const createReportSchema = z.object({
  category: z.nativeEnum(ReportCategory, {
    errorMap: () => ({ message: '유효한 카테고리를 선택해주세요 (parent, student, colleague)' }),
  }),
  sub_category: z.string().min(1, '세부 카테고리를 입력해주세요'),
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자를 초과할 수 없습니다'),
  description: z
    .string()
    .min(10, '설명은 최소 10자 이상이어야 합니다')
    .max(5000, '설명은 5000자를 초과할 수 없습니다'),
  incident_date: z.string().datetime('유효한 날짜 형식(ISO 8601)을 입력해주세요'),
  incident_location: z.string().optional(),
  perpetrator_type: z.string().optional(),
  priority: z.nativeEnum(ReportPriority, {
    errorMap: () => ({ message: '유효한 우선순위를 선택해주세요 (normal, high, critical)' }),
  }),
});

/**
 * 신고 업데이트 스키마
 */
export const updateReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  assigned_lawyer_id: z.string().uuid().optional(),
  incident_location: z.string().optional(),
  perpetrator_type: z.string().optional(),
  priority: z.nativeEnum(ReportPriority).optional(),
});

/**
 * 신고 목록 쿼리 스키마
 */
export const reportQuerySchema = z.object({
  status: z.nativeEnum(ReportStatus).optional(),
  priority: z.nativeEnum(ReportPriority).optional(),
  category: z.nativeEnum(ReportCategory).optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'page는 1 이상이어야 합니다')),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'limit는 1 이상이어야 합니다').max(100, 'limit는 100 이하여야 합니다')),
});

/**
 * 타입 추론
 */
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQueryParams = z.infer<typeof reportQuerySchema>;
