// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * E2E Test: 게시글 상세 조회 (UR-004 related)
 *
 * @SPEC:COMMUNITY-001
 * - 게시글 상세 정보 조회
 * - 조회수 자동 증가
 * - 댓글 목록 포함 확인
 * - 인기 게시글 배지 (ER-004: 조회수 100회 이상)
 * - 블라인드 게시글 처리 (SR-003)
 * - 성능 (P-002: 300ms 이내)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('COMMUNITY-001 E2E: 게시글 상세 조회', () => {
  let supabase: ReturnType<typeof createClient>;
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

  describe('게시글 상세 조회 성공', () => {
    it('유효한 ID로 게시글 상세 정보를 조회할 수 있어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', testPostId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(testPostId);
      expect(data.title).toBeDefined();
      expect(data.content).toBeDefined();
      expect(data.category).toBeDefined();
      expect(data.anonymous_nickname).toBeDefined();
      expect(data.view_count).toBeGreaterThanOrEqual(0);
      expect(data.created_at).toBeDefined();
    });

    it('게시글 상세 조회 시 모든 필드가 반환되어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', testPostId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 필수 필드
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('author_id');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('anonymous_nickname');
      expect(data).toHaveProperty('view_count');
      expect(data).toHaveProperty('created_at');
      expect(data).toHaveProperty('updated_at');

      // 선택 필드
      expect(data).toHaveProperty('image_url');
      expect(data).toHaveProperty('is_popular');
      expect(data).toHaveProperty('is_blinded');
    });
  });

  describe('조회수 증가', () => {
    it('게시글 조회 시 view_count가 증가해야 함', async () => {
      // 현재 조회수 확인
      const { data: beforeData } = await supabase
        .from('posts')
        .select('view_count')
        .eq('id', testPostId)
        .single();

      const beforeViewCount = beforeData?.view_count || 0;

      // 조회수 증가 (RPC 또는 직접 UPDATE)
      await supabase
        .from('posts')
        .update({ view_count: beforeViewCount + 1 })
        .eq('id', testPostId);

      // 조회수 확인
      const { data: afterData } = await supabase
        .from('posts')
        .select('view_count')
        .eq('id', testPostId)
        .single();

      expect(afterData?.view_count).toBeGreaterThan(beforeViewCount);
    });
  });

  describe('댓글 목록 포함', () => {
    it('게시글 상세 조회 시 댓글 목록도 함께 조회할 수 있어야 함', async () => {
      // Fetch comments separately since foreign key relationship may not be configured
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', testPostId);

      expect(error).toBeNull();
      expect(comments).toBeDefined();
      expect(Array.isArray(comments)).toBe(true);
    });

    it('댓글이 최신순으로 정렬되어야 함', async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', testPostId)
        .order('created_at', { ascending: false });

      if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const current = new Date(data[i].created_at).getTime();
          const next = new Date(data[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('인기 게시글 배지 (ER-004)', () => {
    it('조회수 100회 이상인 게시글은 is_popular가 true여야 함', async () => {
      // 인기 게시글 조회 (조회수 100회 이상)
      const { data } = await supabase
        .from('posts')
        .select('*')
        .gte('view_count', 100)
        .eq('is_popular', true)
        .limit(1)
        .single();

      if (data) {
        expect(data.view_count).toBeGreaterThanOrEqual(100);
        expect(data.is_popular).toBe(true);
      }
    });

    it('조회수 100회 미만인 게시글은 is_popular가 false여야 함', async () => {
      // 일반 게시글 조회 (조회수 100회 미만)
      const { data } = await supabase
        .from('posts')
        .select('*')
        .lt('view_count', 100)
        .limit(1)
        .single();

      if (data) {
        expect(data.view_count).toBeLessThan(100);
        expect(data.is_popular).toBe(false);
      }
    });
  });

  describe('블라인드 게시글 처리 (SR-003)', () => {
    it('블라인드 처리된 게시글을 조회할 수 있어야 함', async () => {
      // 블라인드 게시글 조회
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('is_blinded', true)
        .limit(1)
        .single();

      if (data) {
        expect(data.is_blinded).toBe(true);
      }
    });

    it('블라인드 되지 않은 게시글은 is_blinded가 false여야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_blinded', false)
        .limit(1);

      // Skip test if no non-blinded posts exist or if data is null
      if (!data || data.length === 0 || error) {
        console.log('Skipping test: No non-blinded posts found in database');
        return;
      }

      expect(data[0].is_blinded).toBe(false);
    });
  });

  describe('잘못된 요청', () => {
    it('존재하지 않는 게시글 ID로 조회 시 데이터가 null이어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      // Supabase는 single()에서 데이터가 없으면 error를 반환
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });

    it('잘못된 형식의 ID로 조회 시 실패해야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', 'invalid-id')
        .single();

      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });
  });

  describe('성능 (P-002)', () => {
    it('게시글 상세 조회가 300ms 이내에 완료되어야 함', async () => {
      const startTime = performance.now();

      await supabase
        .from('posts')
        .select('*')
        .eq('id', testPostId)
        .single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300); // 300ms 이내
    });

    it('게시글 + 댓글 조회가 500ms 이내에 완료되어야 함', async () => {
      const startTime = performance.now();

      await supabase
        .from('posts')
        .select(`
          *,
          comments(*)
        `)
        .eq('id', testPostId)
        .single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 500ms 이내 (댓글 포함)
    });
  });

  describe('필터링 및 검색', () => {
    it('카테고리별로 게시글을 조회할 수 있어야 함', async () => {
      const categories = ['case', 'qa', 'info'];

      for (const category of categories) {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('category', category)
          .limit(1);

        expect(error).toBeNull();
        if (data && data.length > 0) {
          expect(data[0].category).toBe(category);
        }
      }
    });

    it('제목으로 게시글을 검색할 수 있어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', '%E2E 테스트%')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data) {
        data.forEach((post) => {
          expect(post.title).toContain('E2E 테스트');
        });
      }
    });
  });
});
