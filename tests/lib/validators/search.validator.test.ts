// @TEST:SEARCH-001 | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 검색 검증 스키마 테스트

import { describe, it, expect } from 'vitest';
import {
  searchQuerySchema,
  autocompleteSchema,
  searchHistorySchema,
} from '@/lib/validators/search.validator';

describe('@TEST:SEARCH-001 - Search Validator', () => {
  describe('searchQuerySchema', () => {
    it('should accept valid search query', () => {
      const input = {
        query: '폭언 처벌',
        category: 'reports',
        page: 1,
        limit: 20,
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject query less than 2 characters', () => {
      const input = {
        query: 'a',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 2자');
      }
    });

    it('should reject query more than 100 characters', () => {
      const input = {
        query: 'a'.repeat(101),
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최대 100자');
      }
    });

    it('should reject XSS attempts (HTML tags)', () => {
      const input = {
        query: '<script>alert("XSS")</script>',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('특수문자');
      }
    });

    it('should reject XSS attempts (script injection)', () => {
      const input = {
        query: 'javascript:alert(1)',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('특수문자');
      }
    });

    it('should accept valid category', () => {
      const input = {
        query: '폭언',
        category: 'consultations',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category', () => {
      const input = {
        query: '폭언',
        category: 'invalid_category',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept valid date range (start < end)', () => {
      const input = {
        query: '폭언',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject date range where start > end', () => {
      const input = {
        query: '폭언',
        start_date: '2025-01-31',
        end_date: '2025-01-01',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('시작일은 종료일보다 이전');
      }
    });

    it('should accept valid pagination (page >= 1)', () => {
      const input = {
        query: '폭언',
        page: 1,
        limit: 20,
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject page < 1', () => {
      const input = {
        query: '폭언',
        page: 0,
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('page는 1 이상');
      }
    });

    it('should reject limit > 100', () => {
      const input = {
        query: '폭언',
        limit: 101,
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('limit는 100 이하');
      }
    });

    it('should use default pagination values', () => {
      const input = {
        query: '폭언',
      };

      const result = searchQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe('autocompleteSchema', () => {
    it('should accept valid autocomplete query (1-50 chars)', () => {
      const input = {
        query: '폭',
      };

      const result = autocompleteSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty autocomplete query', () => {
      const input = {
        query: '',
      };

      const result = autocompleteSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최소 1자');
      }
    });

    it('should reject autocomplete query > 50 chars', () => {
      const input = {
        query: 'a'.repeat(51),
      };

      const result = autocompleteSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('최대 50자');
      }
    });
  });
});
