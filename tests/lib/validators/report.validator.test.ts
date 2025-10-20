// @TEST:REPORT-001 | SPEC: .moai/specs/SPEC-REPORT-001/spec.md
// 신고 검증 스키마 테스트

import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  updateReportSchema,
  reportQuerySchema,
  ReportCategory,
  ReportStatus,
  ReportPriority,
} from '@/lib/validators/report.validator';

describe('Report Validator - @TEST:REPORT-001', () => {
  describe('createReportSchema', () => {
    it('유효한 신고 데이터를 검증해야 한다', () => {
      const validData = {
        category: ReportCategory.PARENT,
        sub_category: 'verbal_abuse',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모가 전화로 폭언을 했습니다.',
        incident_date: '2025-10-15T10:30:00Z',
        incident_location: '교무실',
        perpetrator_type: '학부모',
        priority: ReportPriority.HIGH,
      };

      const result = createReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('필수 필드가 없으면 검증 실패해야 한다', () => {
      const invalidData = {
        category: ReportCategory.STUDENT,
        // title, description, incident_date 누락
      };

      const result = createReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('description이 5000자를 초과하면 검증 실패해야 한다', () => {
      const longText = 'a'.repeat(5001);
      const invalidData = {
        category: ReportCategory.COLLEAGUE,
        sub_category: 'harassment',
        title: '제목',
        description: longText,
        incident_date: '2025-10-15T10:30:00Z',
        priority: ReportPriority.NORMAL,
      };

      const result = createReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000');
      }
    });

    it('잘못된 category 값은 검증 실패해야 한다', () => {
      const invalidData = {
        category: 'invalid_category',
        sub_category: 'test',
        title: '제목',
        description: '내용',
        incident_date: '2025-10-15T10:30:00Z',
        priority: ReportPriority.NORMAL,
      };

      const result = createReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('잘못된 priority 값은 검증 실패해야 한다', () => {
      const invalidData = {
        category: ReportCategory.PARENT,
        sub_category: 'test',
        title: '제목',
        description: '내용',
        incident_date: '2025-10-15T10:30:00Z',
        priority: 'invalid_priority',
      };

      const result = createReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateReportSchema', () => {
    it('부분 업데이트 데이터를 검증해야 한다', () => {
      const validData = {
        title: '수정된 제목',
        description: '수정된 내용입니다. 최소 10자 이상이어야 합니다.',
      };

      const result = updateReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('status 변경을 검증해야 한다', () => {
      const validData = {
        status: ReportStatus.ASSIGNED,
        assigned_lawyer_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = updateReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('빈 객체도 허용해야 한다 (선택적 필드)', () => {
      const result = updateReportSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('reportQuerySchema', () => {
    it('유효한 쿼리 파라미터를 검증해야 한다', () => {
      const validQuery = {
        status: ReportStatus.SUBMITTED,
        priority: ReportPriority.HIGH,
        page: '1',
        limit: '10',
      };

      const result = reportQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('기본값을 적용해야 한다', () => {
      const emptyQuery = {};

      const result = reportQuerySchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('page와 limit은 최소 1 이상이어야 한다', () => {
      const invalidQuery = {
        page: '0',
        limit: '-1',
      };

      const result = reportQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('limit은 최대 100까지 허용해야 한다', () => {
      const validQuery = { limit: '100' };
      const result1 = reportQuerySchema.safeParse(validQuery);
      expect(result1.success).toBe(true);

      const invalidQuery = { limit: '101' };
      const result2 = reportQuerySchema.safeParse(invalidQuery);
      expect(result2.success).toBe(false);
    });
  });

  describe('Enum Values', () => {
    it('ReportCategory는 3가지 값을 가져야 한다', () => {
      expect(Object.values(ReportCategory)).toEqual([
        'parent',
        'student',
        'colleague',
      ]);
    });

    it('ReportStatus는 5가지 상태를 가져야 한다', () => {
      expect(Object.values(ReportStatus)).toEqual([
        'submitted',
        'assigned',
        'in_progress',
        'resolved',
        'closed',
      ]);
    });

    it('ReportPriority는 3가지 우선순위를 가져야 한다', () => {
      expect(Object.values(ReportPriority)).toEqual([
        'normal',
        'high',
        'critical',
      ]);
    });
  });
});
