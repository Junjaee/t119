// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * E2E Test: 게시글 목록 조회 (UR-002)
 *
 * @SPEC:COMMUNITY-001 UR-002
 * - 전체 게시글 목록 조회 (페이지네이션)
 * - 카테고리별 필터링 (case/qa/info)
 * - 정렬 (latest/popular)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('COMMUNITY-001 E2E: 게시글 목록 조회 (UR-002)', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  describe('전체 목록 조회', () => {
    it('E2E 테스트 게시글이 10개 이상 존재해야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(10);
    });

    it('게시글 목록에 필수 필드가 모두 포함되어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('anonymous_nickname');
      expect(data).toHaveProperty('is_popular');
      expect(data).toHaveProperty('view_count');
      expect(data).toHaveProperty('created_at');
    });

    it('페이지네이션이 정상 작동해야 함', async () => {
      // 첫 페이지 (5개)
      const { data: page1, error: error1 } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .order('created_at', { ascending: false })
        .range(0, 4); // 0부터 4까지 = 5개

      expect(error1).toBeNull();
      expect(page1).toBeDefined();
      expect(page1!.length).toBe(5);

      // 두 번째 페이지 (5개)
      const { data: page2, error: error2 } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .order('created_at', { ascending: false })
        .range(5, 9); // 5부터 9까지 = 5개

      expect(error2).toBeNull();
      expect(page2).toBeDefined();
      expect(page2!.length).toBe(5);

      // 두 페이지가 다른 게시글을 포함해야 함
      expect(page1![0].id).not.toBe(page2![0].id);
    });
  });

  describe('카테고리 필터링', () => {
    it('사례(case) 카테고리만 조회되어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .eq('category', 'case');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // 모든 게시글이 case 카테고리여야 함
      data!.forEach((post) => {
        expect(post.category).toBe('case');
      });
    });

    it('Q&A(qa) 카테고리만 조회되어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .eq('category', 'qa');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      data!.forEach((post) => {
        expect(post.category).toBe('qa');
      });
    });

    it('정보(info) 카테고리만 조회되어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .eq('category', 'info');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      data!.forEach((post) => {
        expect(post.category).toBe('info');
      });
    });
  });

  describe('정렬 기능', () => {
    it('최신순(created_at DESC) 정렬이 정상 작동해야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .order('created_at', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // 날짜가 내림차순으로 정렬되어 있어야 함
      for (let i = 0; i < data!.length - 1; i++) {
        const current = new Date(data![i].created_at).getTime();
        const next = new Date(data![i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('인기순(view_count + is_popular) 정렬이 정상 작동해야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .order('is_popular', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // 인기 게시글이 먼저 와야 함
      if (data!.length > 1) {
        const firstPost = data![0];
        expect(firstPost.is_popular || firstPost.view_count > 100).toBeTruthy();
      }
    });
  });

  describe('블라인드 게시글 처리', () => {
    it('블라인드 게시글은 목록에서 제외되어야 함', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .eq('is_blinded', false);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 모든 게시글이 블라인드 상태가 아니어야 함
      data!.forEach((post) => {
        expect(post.is_blinded).toBe(false);
      });
    });
  });

  describe('빈 상태 처리', () => {
    it('존재하지 않는 카테고리 조회 시 빈 배열 반환', async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'NON_EXISTENT_POST_TITLE_12345%');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBe(0);
    });
  });

  describe('성능 테스트', () => {
    it('게시글 목록 조회가 2초 이내에 완료되어야 함', async () => {
      const startTime = performance.now();

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .like('title', 'E2E 테스트%')
        .order('created_at', { ascending: false })
        .limit(20);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(2000); // 2초 이내
    });
  });
});
