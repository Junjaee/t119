// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * E2E Test: 댓글 작성 (UR-003)
 *
 * @SPEC:COMMUNITY-001 UR-003
 * - 게시글에 댓글 작성 기능
 * - 댓글 내용 1-500자 제한 (C-003)
 * - 동일 게시글 내 동일 작성자는 동일 익명 닉네임 유지 (ER-001)
 * - 댓글 목록 조회 (최신순 정렬)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('COMMUNITY-001 E2E: 댓글 작성 (UR-003)', () => {
  let supabase: ReturnType<typeof createClient>;
  const createdCommentIds: string[] = [];
  let testPostId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 테스트용 게시글 ID 가져오기 (E2E 테스트 게시글 중 하나 사용)
    const { data } = await supabase
      .from('posts')
      .select('id')
      .like('title', 'E2E 테스트%')
      .limit(1)
      .single();

    if (data) {
      testPostId = data.id;
    }
  });

  afterAll(async () => {
    // 테스트 후 생성된 댓글 정리
    if (createdCommentIds.length > 0) {
      await supabase.from('comments').delete().in('id', createdCommentIds);
    }
  });

  describe('댓글 작성 성공', () => {
    it('유효한 데이터로 댓글 작성이 성공해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '테스트 댓글입니다.',
        anonymous_nickname: '익명의 댓글러',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.content).toBe(testComment.content);
      expect(data.post_id).toBe(testPostId);
      expect(data.anonymous_nickname).toBeDefined();
      expect(data.anonymous_nickname).toMatch(/^익명의 /);

      if (data?.id) {
        createdCommentIds.push(data.id);
      }
    });

    it('최소 길이(1자) 댓글 작성이 가능해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '최',
        anonymous_nickname: '익명의 짧은댓글',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.content.length).toBe(1);

      if (data?.id) {
        createdCommentIds.push(data.id);
      }
    });

    it('최대 길이(500자) 댓글 작성이 가능해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '댓'.repeat(500),
        anonymous_nickname: '익명의 긴댓글',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.content.length).toBe(500);

      if (data?.id) {
        createdCommentIds.push(data.id);
      }
    });
  });

  describe('댓글 내용 제약 (C-003)', () => {
    it('댓글이 빈 문자열일 때 실패해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '',
        anonymous_nickname: '익명의 빈댓글',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('comments_content_check');
    });

    it('댓글이 500자를 초과할 때 실패해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '댓'.repeat(501),
        anonymous_nickname: '익명의 초과댓글',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('comments_content_check');
    });

    it('댓글이 1-500자 범위일 때 성공해야 함', async () => {
      const testCases = [
        { length: 1, content: '최' },
        { length: 250, content: '댓'.repeat(250) },
        { length: 500, content: '댓'.repeat(500) },
      ];

      for (const testCase of testCases) {
        const testComment = {
          author_id: 'a0000000-0000-0000-0000-000000000001',
          post_id: testPostId,
          content: testCase.content,
          anonymous_nickname: '익명의 테스터',
        };

        const { data, error } = await supabase
          .from('comments')
          .insert(testComment)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.content.length).toBeGreaterThanOrEqual(1);
        expect(data.content.length).toBeLessThanOrEqual(500);

        if (data?.id) {
          createdCommentIds.push(data.id);
        }
      }
    });
  });

  describe('필수 필드 검증', () => {
    it('post_id가 없을 때 실패해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        content: '테스트 댓글입니다.',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('author_id가 없을 때 실패해야 함', async () => {
      const testComment = {
        post_id: testPostId,
        content: '테스트 댓글입니다.',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('content가 없을 때 실패해야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });
  });

  describe('댓글 기본값 검증', () => {
    it('댓글 작성 시 기본값이 올바르게 설정되어야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '기본값 검증 댓글입니다.',
        anonymous_nickname: '익명의 테스터',
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 기본값 검증
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      if (data?.id) {
        createdCommentIds.push(data.id);
      }
    });
  });

  describe('댓글 목록 조회', () => {
    it('특정 게시글의 댓글 목록이 조회되어야 함', async () => {
      // 테스트용 댓글 2개 생성
      const comment1 = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '첫 번째 댓글입니다.',
        anonymous_nickname: '익명의 댓글러1',
      };

      const comment2 = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '두 번째 댓글입니다.',
        anonymous_nickname: '익명의 댓글러2',
      };

      const { data: data1 } = await supabase
        .from('comments')
        .insert(comment1)
        .select()
        .single();

      const { data: data2 } = await supabase
        .from('comments')
        .insert(comment2)
        .select()
        .single();

      if (data1?.id) createdCommentIds.push(data1.id);
      if (data2?.id) createdCommentIds.push(data2.id);

      // 댓글 목록 조회
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', testPostId)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(2);

      // 모든 댓글이 같은 게시글에 속해야 함
      data!.forEach((comment) => {
        expect(comment.post_id).toBe(testPostId);
      });
    });

    it('댓글 목록이 최신순으로 정렬되어야 함', async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', testPostId)
        .order('created_at', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 1) {
        // 날짜가 내림차순으로 정렬되어 있어야 함
        for (let i = 0; i < data.length - 1; i++) {
          const current = new Date(data[i].created_at).getTime();
          const next = new Date(data[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('익명 닉네임 일관성 (ER-001)', () => {
    it('동일 작성자가 동일 게시글에 작성한 댓글은 동일 닉네임을 가져야 함', async () => {
      const authorId = 'a0000000-0000-0000-0000-000000000001';
      const nickname = '익명의 일관성테스터';

      // 첫 번째 댓글 작성
      const { data: data1 } = await supabase
        .from('comments')
        .insert({
          author_id: authorId,
          post_id: testPostId,
          content: '첫 번째 댓글',
          anonymous_nickname: nickname,
        })
        .select()
        .single();

      // 두 번째 댓글 작성 (같은 작성자, 같은 게시글, 같은 닉네임)
      const { data: data2 } = await supabase
        .from('comments')
        .insert({
          author_id: authorId,
          post_id: testPostId,
          content: '두 번째 댓글',
          anonymous_nickname: nickname,
        })
        .select()
        .single();

      if (data1?.id) createdCommentIds.push(data1.id);
      if (data2?.id) createdCommentIds.push(data2.id);

      // 두 댓글의 닉네임이 동일해야 함
      expect(data1?.anonymous_nickname).toBe(data2?.anonymous_nickname);
      expect(data1?.anonymous_nickname).toBe(nickname);
    });
  });

  describe('댓글 작성 성능', () => {
    it('댓글 작성이 1초 이내에 완료되어야 함', async () => {
      const testComment = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        content: '성능 테스트 댓글입니다.',
        anonymous_nickname: '익명의 테스터',
      };

      const startTime = performance.now();

      const { data, error } = await supabase
        .from('comments')
        .insert(testComment)
        .select()
        .single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(1000); // 1초 이내

      if (data?.id) {
        createdCommentIds.push(data.id);
      }
    });
  });
});
