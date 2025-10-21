// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 게시글 검증 스키마 테스트

import { describe, it, expect } from 'vitest';
import {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
  PostCategory,
  type CreatePostInput,
  type UpdatePostInput,
  type PostQueryParams,
} from '@/lib/validators/post.validator';

describe('createPostSchema (게시글 작성 검증)', () => {
  describe('정상 케이스', () => {
    it('유효한 게시글 데이터는 검증을 통과해야 한다', () => {
      const validPost = {
        category: 'case' as const,
        title: '학부모 상담 사례 공유',
        content: '오늘 있었던 학부모 상담 사례를 공유합니다. 학부모님께서 학생의 성적 향상을 위해 매우 협조적이셨습니다.',
      };

      const result = createPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPost);
      }
    });

    it('모든 카테고리(case, qa, info)를 허용해야 한다', () => {
      const categories: PostCategory[] = ['case', 'qa', 'info'];

      categories.forEach((category) => {
        const post = {
          category,
          title: '테스트 제목입니다',
          content: '테스트 본문입니다. 최소 20자 이상이어야 합니다.',
        };
        const result = createPostSchema.safeParse(post);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('제목 검증 (C-001: 5~100자)', () => {
    it('제목이 5자 미만이면 실패해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: '짧음',
        content: '본문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5자');
      }
    });

    it('제목이 100자를 초과하면 실패해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: 'a'.repeat(101),
        content: '본문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100자');
      }
    });

    it('제목이 정확히 5자면 통과해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: '제목다섯자',
        content: '본문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    });

    it('제목이 정확히 100자면 통과해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: 'a'.repeat(100),
        content: '본문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    });
  });

  describe('본문 검증 (C-002: 20~5000자)', () => {
    it('본문이 20자 미만이면 실패해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: '테스트 제목',
        content: '짧은 본문',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('20자');
      }
    });

    it('본문이 5000자를 초과하면 실패해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: '테스트 제목',
        content: 'a'.repeat(5001),
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000자');
      }
    });

    it('본문이 정확히 20자면 통과해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: '테스트 제목',
        content: 'a'.repeat(20),
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    });

    it('본문이 정확히 5000자면 통과해야 한다', () => {
      const post = {
        category: 'case' as const,
        title: '테스트 제목',
        content: 'a'.repeat(5000),
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    });
  });

  describe('카테고리 검증', () => {
    it('유효하지 않은 카테고리는 실패해야 한다', () => {
      const post = {
        category: 'invalid',
        title: '테스트 제목',
        content: '본문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('카테고리');
      }
    });

    it('카테고리가 누락되면 실패해야 한다', () => {
      const post = {
        title: '테스트 제목',
        content: '본문 내용입니다. 최소 20자 이상이어야 합니다.',
      };

      const result = createPostSchema.safeParse(post);
      expect(result.success).toBe(false);
    });
  });
});

describe('updatePostSchema (게시글 수정 검증)', () => {
  it('모든 필드가 선택적이어야 한다', () => {
    const updates = [
      { title: '새로운 제목' },
      { content: '새로운 본문입니다. 최소 20자 이상이어야 합니다.' },
      {
        title: '새로운 제목',
        content: '새 본문입니다. 최소 20자 이상이어야 합니다.',
      },
      {},
    ];

    updates.forEach((update) => {
      const result = updatePostSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  it('제목이 제공되면 5~100자 검증을 수행해야 한다', () => {
    const tooShort = { title: '짧음' };
    const tooLong = { title: 'a'.repeat(101) };
    const valid = { title: '적절한 제목' };

    expect(updatePostSchema.safeParse(tooShort).success).toBe(false);
    expect(updatePostSchema.safeParse(tooLong).success).toBe(false);
    expect(updatePostSchema.safeParse(valid).success).toBe(true);
  });

  it('본문이 제공되면 20~5000자 검증을 수행해야 한다', () => {
    const tooShort = { content: '짧음' };
    const tooLong = { content: 'a'.repeat(5001) };
    const valid = { content: '적절한 본문입니다. 최소 20자 이상이어야 합니다.' };

    expect(updatePostSchema.safeParse(tooShort).success).toBe(false);
    expect(updatePostSchema.safeParse(tooLong).success).toBe(false);
    expect(updatePostSchema.safeParse(valid).success).toBe(true);
  });
});

describe('postQuerySchema (게시글 목록 쿼리 검증)', () => {
  describe('페이지네이션', () => {
    it('기본값: page=1, limit=20이어야 한다', () => {
      const result = postQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('page는 1 이상이어야 한다', () => {
      const invalid = { page: '0' };
      const valid = { page: '1' };

      expect(postQuerySchema.safeParse(invalid).success).toBe(false);
      expect(postQuerySchema.safeParse(valid).success).toBe(true);
    });

    it('limit는 1~100 사이여야 한다', () => {
      const tooSmall = { limit: '0' };
      const tooLarge = { limit: '101' };
      const valid = { limit: '50' };

      expect(postQuerySchema.safeParse(tooSmall).success).toBe(false);
      expect(postQuerySchema.safeParse(tooLarge).success).toBe(false);
      expect(postQuerySchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('카테고리 필터', () => {
    it('유효한 카테고리 필터를 허용해야 한다', () => {
      const categories: PostCategory[] = ['case', 'qa', 'info'];

      categories.forEach((category) => {
        const result = postQuerySchema.safeParse({ category });
        expect(result.success).toBe(true);
      });
    });

    it('유효하지 않은 카테고리는 실패해야 한다', () => {
      const result = postQuerySchema.safeParse({ category: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('정렬', () => {
    it('latest와 popular 정렬을 허용해야 한다', () => {
      const sorts = ['latest', 'popular'];

      sorts.forEach((sort) => {
        const result = postQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
      });
    });

    it('기본 정렬은 latest여야 한다', () => {
      const result = postQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe('latest');
      }
    });
  });
});
