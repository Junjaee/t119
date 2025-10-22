// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * E2E Test: 게시글 작성 (UR-001)
 *
 * @SPEC:COMMUNITY-001 UR-001
 * - 익명 게시글 작성 기능
 * - 제목 5-100자 제한 (C-001)
 * - 본문 20-5000자 제한 (C-002)
 * - 카테고리 선택 (case/qa/info)
 * - 자동 익명 닉네임 부여 (ER-001)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('COMMUNITY-001 E2E: 게시글 작성 (UR-001)', () => {
  let supabase: ReturnType<typeof createClient>;
  const createdPostIds: string[] = [];

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  afterAll(async () => {
    // 테스트 후 생성된 게시글 정리
    if (createdPostIds.length > 0) {
      await supabase.from('posts').delete().in('id', createdPostIds);
    }
  });

  describe('게시글 작성 성공', () => {
    it('유효한 데이터로 게시글 작성이 성공해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E2E 테스트: 유효한 게시글 작성 테스트',
        content: '이것은 유효한 게시글 본문입니다. 최소 20자 이상의 내용을 포함해야 합니다. 테스트 데이터입니다.',
        anonymous_nickname: '익명의 테스터',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.title).toBe(testPost.title);
      expect(data.content).toBe(testPost.content);
      expect(data.category).toBe(testPost.category);
      expect(data.anonymous_nickname).toBeDefined();
      expect(data.anonymous_nickname).toMatch(/^익명의 /); // 익명 닉네임 형식 확인

      if (data?.id) {
        createdPostIds.push(data.id);
      }
    });

    it('모든 카테고리(case, qa, info)로 게시글 작성이 가능해야 함', async () => {
      const categories = ['case', 'qa', 'info'] as const;

      for (const category of categories) {
        const testPost = {
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category,
          title: `E2E 테스트: ${category} 카테고리 게시글`,
          content: `${category} 카테고리 테스트 게시글입니다. 최소 20자 이상의 내용을 포함합니다.`,
          anonymous_nickname: `익명의 ${category}`,
        };

        const { data, error } = await supabase
          .from('posts')
          .insert(testPost)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.category).toBe(category);

        if (data?.id) {
          createdPostIds.push(data.id);
        }
      }
    });

    it('이미지 URL을 포함한 게시글 작성이 가능해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E2E 테스트: 이미지 포함 게시글',
        content: '이미지가 포함된 게시글입니다. 최소 20자 이상의 내용을 포함합니다.',
        image_url: 'https://example.com/test-image.jpg',
        anonymous_nickname: '익명의 사진작가',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.image_url).toBe(testPost.image_url);

      if (data?.id) {
        createdPostIds.push(data.id);
      }
    });
  });

  describe('게시글 제목 제약 (C-001)', () => {
    it('제목이 5자 미만일 때 실패해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: '짧은', // 2자 (5자 미만)
        content: '본문은 유효합니다. 최소 20자 이상의 내용을 포함합니다.',
        anonymous_nickname: '익명의 짧은글',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('posts_title_check');
    });

    it('제목이 100자를 초과할 때 실패해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E'.repeat(101), // 101자 (100자 초과)
        content: '본문은 유효합니다. 최소 20자 이상의 내용을 포함합니다.',
        anonymous_nickname: '익명의 긴제목',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('posts_title_check');
    });

    it('제목이 5-100자 범위일 때 성공해야 함', async () => {
      const testCases = [
        { length: 5, title: '5자의제목' },
        { length: 50, title: '중간 길이 제목입니다'.repeat(3) },
        { length: 100, title: '제'.repeat(100) },
      ];

      for (const testCase of testCases) {
        const testPost = {
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category: 'case',
          title: testCase.title,
          content: '본문은 유효합니다. 최소 20자 이상의 내용을 포함합니다.',
          anonymous_nickname: '익명의 테스터',
        };

        const { data, error } = await supabase
          .from('posts')
          .insert(testPost)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.title.length).toBeGreaterThanOrEqual(5);
        expect(data.title.length).toBeLessThanOrEqual(100);

        if (data?.id) {
          createdPostIds.push(data.id);
        }
      }
    });
  });

  describe('게시글 본문 제약 (C-002)', () => {
    it('본문이 20자 미만일 때 실패해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E2E 테스트: 짧은 본문',
        content: '짧은 본문', // 5자 (20자 미만)
        anonymous_nickname: '익명의 짧은글',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('posts_content_check');
    });

    it('본문이 5000자를 초과할 때 실패해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E2E 테스트: 긴 본문',
        content: '본'.repeat(5001), // 5001자 (5000자 초과)
        anonymous_nickname: '익명의 긴글',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('posts_content_check');
    });

    it('본문이 20-5000자 범위일 때 성공해야 함', async () => {
      const testCases = [
        { length: 20, content: '최소 길이 본문입니다 정확히20자입니다' },
        { length: 2500, content: '본'.repeat(2500) },
        { length: 5000, content: '본'.repeat(5000) },
      ];

      for (const testCase of testCases) {
        const testPost = {
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category: 'case',
          title: `E2E 테스트: 본문 ${testCase.length}자`,
          content: testCase.content,
          anonymous_nickname: '익명의 테스터',
        };

        const { data, error } = await supabase
          .from('posts')
          .insert(testPost)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.content.length).toBeGreaterThanOrEqual(20);
        expect(data.content.length).toBeLessThanOrEqual(5000);

        if (data?.id) {
          createdPostIds.push(data.id);
        }
      }
    });
  });

  describe('카테고리 제약', () => {
    it('유효하지 않은 카테고리일 때 실패해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'invalid-category', // 유효하지 않은 카테고리
        title: 'E2E 테스트: 유효하지 않은 카테고리',
        content: '본문은 유효합니다. 최소 20자 이상의 내용을 포함합니다.',
        anonymous_nickname: '익명의 테스터',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('posts_category_check');
    });
  });

  describe('필수 필드 검증', () => {
    it('author_id가 없을 때 실패해야 함', async () => {
      const testPost = {
        category: 'case',
        title: 'E2E 테스트: author_id 없음',
        content: '본문은 유효합니다. 최소 20자 이상의 내용을 포함합니다.',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('category가 없을 때 실패해야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        title: 'E2E 테스트: category 없음',
        content: '본문은 유효합니다. 최소 20자 이상의 내용을 포함합니다.',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });
  });

  describe('게시글 기본값 검증', () => {
    it('게시글 작성 시 기본값이 올바르게 설정되어야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E2E 테스트: 기본값 검증',
        content: '기본값 검증을 위한 게시글입니다. 최소 20자 이상의 내용을 포함합니다.',
        anonymous_nickname: '익명의 테스터',
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 기본값 검증
      expect(data.view_count).toBe(0); // 기본 조회수 0
      expect(data.is_popular).toBe(false); // 기본 인기 게시글 아님
      expect(data.is_blinded).toBe(false); // 기본 블라인드 아님
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      if (data?.id) {
        createdPostIds.push(data.id);
      }
    });
  });

  describe('게시글 조회 성능', () => {
    it('게시글 작성이 1초 이내에 완료되어야 함', async () => {
      const testPost = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case',
        title: 'E2E 테스트: 성능 테스트',
        content: '성능 테스트를 위한 게시글입니다. 최소 20자 이상의 내용을 포함합니다.',
        anonymous_nickname: '익명의 테스터',
      };

      const startTime = performance.now();

      const { data, error } = await supabase
        .from('posts')
        .insert(testPost)
        .select()
        .single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(1000); // 1초 이내

      if (data?.id) {
        createdPostIds.push(data.id);
      }
    });
  });
});
