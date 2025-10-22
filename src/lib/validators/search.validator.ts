// @CODE:SEARCH-001 | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/lib/validators/search.validator.test.ts
// 검색 검증 스키마 (Zod)

import { z } from 'zod';

/**
 * 검색 카테고리
 */
export enum SearchCategory {
  REPORTS = 'reports',
  CONSULTATIONS = 'consultations',
  POSTS = 'posts',
}

/**
 * XSS 방지 검증 (HTML 태그, script 태그 차단)
 */
const noXSSRegex = /^[^<>]*$/;
const noScriptRegex = /^(?!.*javascript:).*$/i;

/**
 * 검색 쿼리 스키마 (C-003: 2~100자 제한)
 */
export const searchQuerySchema = z
  .object({
    query: z
      .string()
      .min(2, '검색어는 최소 2자 이상 입력해주세요')
      .max(100, '검색어는 최대 100자까지 입력 가능합니다')
      .regex(noXSSRegex, '검색어에 특수문자(<, >)를 사용할 수 없습니다')
      .regex(noScriptRegex, '검색어에 특수문자(javascript:)를 사용할 수 없습니다'),
    category: z.nativeEnum(SearchCategory).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.number().min(1, 'page는 1 이상이어야 합니다').default(1),
    limit: z.number().min(1, 'limit는 1 이상이어야 합니다').max(100, 'limit는 100 이하여야 합니다').default(20),
  })
  .refine(
    (data) => {
      // 날짜 범위 검증: start_date < end_date
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) < new Date(data.end_date);
      }
      return true;
    },
    {
      message: '시작일은 종료일보다 이전이어야 합니다',
      path: ['start_date'],
    }
  );

/**
 * 자동완성 스키마 (1~50자 제한)
 */
export const autocompleteSchema = z.object({
  query: z
    .string()
    .min(1, '검색어는 최소 1자 이상 입력해주세요')
    .max(50, '검색어는 최대 50자까지 입력 가능합니다'),
});

/**
 * 검색 이력 스키마
 */
export const searchHistorySchema = z.object({
  user_id: z.string().uuid('유효한 사용자 ID를 입력해주세요'),
  query: z.string().min(1, '검색어를 입력해주세요').max(100, '검색어는 100자를 초과할 수 없습니다'),
});

/**
 * 타입 추론
 */
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type AutocompleteInput = z.infer<typeof autocompleteSchema>;
export type SearchHistoryInput = z.infer<typeof searchHistorySchema>;
