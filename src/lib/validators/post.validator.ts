// @CODE:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | TEST: tests/lib/validators/post.validator.test.ts
// 게시글 검증 스키마 (Zod)

import { z } from 'zod';

/**
 * 게시글 카테고리
 * UR-002: 사례 공유, Q&A, 정보 공유 카테고리
 */
export enum PostCategory {
  CASE = 'case',
  QA = 'qa',
  INFO = 'info',
}

/**
 * 게시글 정렬 방식
 */
export enum PostSort {
  LATEST = 'latest',
  POPULAR = 'popular',
}

/**
 * 게시글 생성 스키마
 * C-001: 제목 5~100자
 * C-002: 본문 20~5000자
 */
export const createPostSchema = z.object({
  category: z.nativeEnum(PostCategory, {
    errorMap: () => ({ message: '유효한 카테고리를 선택해주세요 (case, qa, info)' }),
  }),
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(100, '제목은 100자를 초과할 수 없습니다'),
  content: z
    .string()
    .min(20, '본문은 최소 20자 이상이어야 합니다')
    .max(5000, '본문은 5000자를 초과할 수 없습니다'),
});

/**
 * 게시글 수정 스키마
 * 모든 필드 선택적
 */
export const updatePostSchema = createPostSchema.partial();

/**
 * 게시글 목록 쿼리 스키마
 * - 기본값: page=1, limit=20
 * - limit 최대값: 100
 */
export const postQuerySchema = z.object({
  category: z.nativeEnum(PostCategory).optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, 'page는 1 이상이어야 합니다')),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .min(1, 'limit는 1 이상이어야 합니다')
        .max(100, 'limit는 100 이하여야 합니다')
    ),
  sort: z.nativeEnum(PostSort).optional().default(PostSort.LATEST),
});

/**
 * 타입 추론
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PostQueryParams = z.infer<typeof postQuerySchema>;
