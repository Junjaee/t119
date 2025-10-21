// @CODE:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | TEST: tests/lib/validators/comment.validator.test.ts
// 댓글 검증 스키마 (Zod)

import { z } from 'zod';

/**
 * 댓글 생성 스키마
 * C-003: 댓글 내용 1~500자
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '댓글 내용을 입력해주세요')
    .max(500, '댓글은 500자를 초과할 수 없습니다'),
});

/**
 * 댓글 수정 스키마
 * 모든 필드 선택적
 */
export const updateCommentSchema = createCommentSchema.partial();

/**
 * 타입 추론
 */
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
