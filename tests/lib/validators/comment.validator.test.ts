// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 댓글 검증 스키마 테스트

import { describe, it, expect } from 'vitest';
import {
  createCommentSchema,
  updateCommentSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '@/lib/validators/comment.validator';

describe('createCommentSchema (댓글 작성 검증)', () => {
  describe('정상 케이스', () => {
    it('유효한 댓글을 통과시켜야 한다', () => {
      const validComment = {
        content: '좋은 글 감사합니다!',
      };

      const result = createCommentSchema.safeParse(validComment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(validComment.content);
      }
    });

    it('최소 1자부터 허용해야 한다', () => {
      const minComment = { content: '감' };
      const result = createCommentSchema.safeParse(minComment);
      expect(result.success).toBe(true);
    });

    it('500자까지 허용해야 한다', () => {
      const maxComment = { content: 'a'.repeat(500) };
      const result = createCommentSchema.safeParse(maxComment);
      expect(result.success).toBe(true);
    });
  });

  describe('실패 케이스', () => {
    it('빈 문자열을 거부해야 한다', () => {
      const emptyComment = { content: '' };
      const result = createCommentSchema.safeParse(emptyComment);
      expect(result.success).toBe(false);
    });

    it('공백만 있는 문자열을 거부해야 한다', () => {
      const whitespaceComment = { content: '   ' };
      const result = createCommentSchema.safeParse(whitespaceComment);
      expect(result.success).toBe(false);
    });

    it('500자를 초과하면 거부해야 한다', () => {
      const tooLongComment = { content: 'a'.repeat(501) };
      const result = createCommentSchema.safeParse(tooLongComment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500자');
      }
    });

    it('content 필드가 없으면 거부해야 한다', () => {
      const noContent = {};
      const result = createCommentSchema.safeParse(noContent);
      expect(result.success).toBe(false);
    });

    it('content가 문자열이 아니면 거부해야 한다', () => {
      const invalidType = { content: 123 };
      const result = createCommentSchema.safeParse(invalidType);
      expect(result.success).toBe(false);
    });
  });
});

describe('updateCommentSchema (댓글 수정 검증)', () => {
  it('content 필드가 선택적이어야 한다', () => {
    const emptyUpdate = {};
    const result = updateCommentSchema.safeParse(emptyUpdate);
    expect(result.success).toBe(true);
  });

  it('content가 제공되면 1~500자 검증을 수행해야 한다', () => {
    const tooLong = { content: 'a'.repeat(501) };
    const valid = { content: '수정된 댓글입니다.' };

    expect(updateCommentSchema.safeParse(tooLong).success).toBe(false);
    expect(updateCommentSchema.safeParse(valid).success).toBe(true);
  });

  it('빈 문자열을 거부해야 한다', () => {
    const emptyContent = { content: '' };
    const result = updateCommentSchema.safeParse(emptyContent);
    expect(result.success).toBe(false);
  });
});
