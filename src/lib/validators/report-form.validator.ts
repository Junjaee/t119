// @CODE:REPORT-FORM-001:V1 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md | TEST: tests/reports/report-form.test.ts
// 신고 작성 폼 검증 스키마 (Zod)

import { z } from "zod";

/**
 * 신고 카테고리 (폼 전용)
 */
export const reportFormCategories = ["parent", "student", "other"] as const;
export type ReportFormCategory = (typeof reportFormCategories)[number];

/**
 * 신고 우선순위 (폼 전용)
 */
export const reportFormPriorities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type ReportFormPriority = (typeof reportFormPriorities)[number];

/**
 * 신고 작성 폼 스키마
 *
 * @description
 * - category: 'parent' | 'student' | 'other'
 * - title: 5~100자
 * - description: 20~2000자
 * - incidentDate: YYYY-MM-DD (과거 날짜만 허용)
 * - priority: 'low' | 'medium' | 'high' | 'critical'
 */
export const reportFormSchema = z.object({
  category: z.enum(reportFormCategories, {
    errorMap: () => ({
      message: "유효한 카테고리를 선택해주세요 (학부모, 학생, 기타)",
    }),
  }),
  title: z
    .string()
    .min(5, "제목은 5자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  description: z
    .string()
    .min(20, "설명은 20자 이상이어야 합니다")
    .max(2000, "설명은 2000자 이하여야 합니다"),
  incidentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD여야 합니다")
    .refine(
      (date) => {
        const incidentDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // 오늘 마지막 시간까지 허용
        return incidentDate <= today;
      },
      { message: "사건 날짜는 과거 또는 오늘이어야 합니다" },
    ),
  priority: z.enum(reportFormPriorities, {
    errorMap: () => ({
      message: "유효한 우선순위를 선택해주세요 (낮음, 보통, 높음, 긴급)",
    }),
  }),
});

/**
 * 타입 추론
 */
export type ReportFormData = z.infer<typeof reportFormSchema>;
