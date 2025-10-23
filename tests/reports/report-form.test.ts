// @TEST:REPORT-FORM-001:V1 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md
// 신고 작성 폼 Validator 검증 테스트

import { describe, it, expect } from 'vitest';
import { reportFormSchema, type ReportFormData } from '@/lib/validators/report-form.validator';

describe('@TEST:REPORT-FORM-001:V1 - Report Form Validator', () => {
  describe('정상 케이스', () => {
    it('GIVEN 모든 필수 필드가 유효한 값으로 채워진 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다. 상세 내용은 다음과 같습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('parent');
        expect(result.data.title).toBe('학부모 폭언 사건');
        expect(result.data.priority).toBe('high');
      }
    });

    it('GIVEN category가 student인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'student',
        title: '학생 폭력 사건 발생',
        description: '학생으로부터 물리적 폭력을 당했습니다. 상세 내용입니다.',
        incidentDate: '2025-10-22',
        priority: 'critical',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });

    it('GIVEN category가 other인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'other',
        title: '기타 교권 침해 사건',
        description: '교권 침해 사건이 발생했습니다. 상세 내용을 기록합니다.',
        incidentDate: '2025-10-21',
        priority: 'medium',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });

    it('GIVEN priority가 low인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: '경미한 불편 사항',
        description: '교권 침해로 보기는 어렵지만 기록이 필요한 사안입니다.',
        incidentDate: '2025-10-20',
        priority: 'low',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe('제목 검증', () => {
    it('GIVEN 제목이 5자 미만인 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '폭언',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
        expect(result.error.issues[0].message).toContain('5자 이상');
      }
    });

    it('GIVEN 제목이 100자를 초과하는 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: 'a'.repeat(101),
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
        expect(result.error.issues[0].message).toContain('100자 이하');
      }
    });

    it('GIVEN 제목이 정확히 5자인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: '학부모폭언',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });

    it('GIVEN 제목이 정확히 100자인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: 'a'.repeat(100),
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe('설명 검증', () => {
    it('GIVEN 설명이 20자 미만인 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '폭언을 받았습니다',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
        expect(result.error.issues[0].message).toContain('20자 이상');
      }
    });

    it('GIVEN 설명이 2000자를 초과하는 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: 'a'.repeat(2001),
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
        expect(result.error.issues[0].message).toContain('2000자 이하');
      }
    });

    it('GIVEN 설명이 정확히 20자인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: 'a'.repeat(20),
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });

    it('GIVEN 설명이 정확히 2000자인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: 'a'.repeat(2000),
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });
  });

  describe('사건 날짜 검증', () => {
    it('GIVEN 사건 날짜가 미래인 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: futureDateStr,
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('incidentDate');
        expect(result.error.issues[0].message).toContain('과거');
      }
    });

    it('GIVEN 사건 날짜가 오늘인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const today = new Date().toISOString().split('T')[0];

      const validData: ReportFormData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: today,
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });

    it('GIVEN 사건 날짜가 과거인 경우 WHEN 검증을 수행하면 THEN 성공해야 한다', () => {
      // Given
      const validData: ReportFormData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-01-01',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(validData);

      // Then
      expect(result.success).toBe(true);
    });

    it('GIVEN 사건 날짜 형식이 YYYY-MM-DD가 아닌 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '23/10/2025',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('incidentDate');
      }
    });
  });

  describe('카테고리 검증', () => {
    it('GIVEN 카테고리가 유효하지 않은 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'invalid',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('category');
      }
    });
  });

  describe('우선순위 검증', () => {
    it('GIVEN 우선순위가 유효하지 않은 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'invalid',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('priority');
      }
    });
  });

  describe('필수 필드 검증', () => {
    it('GIVEN 카테고리가 누락된 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('category');
      }
    });

    it('GIVEN 제목이 누락된 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('GIVEN 설명이 누락된 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        incidentDate: '2025-10-23',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('GIVEN 사건 날짜가 누락된 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        priority: 'high',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('incidentDate');
      }
    });

    it('GIVEN 우선순위가 누락된 경우 WHEN 검증을 수행하면 THEN 실패해야 한다', () => {
      // Given
      const invalidData = {
        category: 'parent',
        title: '학부모 폭언 사건',
        description: '수업 중 학부모로부터 폭언을 받았습니다.',
        incidentDate: '2025-10-23',
      };

      // When
      const result = reportFormSchema.safeParse(invalidData);

      // Then
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('priority');
      }
    });
  });
});
