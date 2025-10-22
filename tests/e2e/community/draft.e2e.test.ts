// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * E2E Test: 임시 저장 (UR-006 related)
 *
 * @SPEC:COMMUNITY-001 SR-002
 * - 임시 저장 기능
 * - 임시 저장 목록 조회
 * - 임시 저장 → 게시글 발행
 * - 임시 저장 삭제
 * - 자동 저장 (SR-002: 30초마다)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('COMMUNITY-001 E2E: 임시 저장 (Draft)', () => {
  let supabase: ReturnType<typeof createClient>;
  const createdDraftIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Clean up any existing drafts for test author to avoid unique constraint violations
    // Database has unique constraint on (author_id, category) - one draft per category per user
    await supabase
      .from('post_drafts')
      .delete()
      .eq('author_id', 'a0000000-0000-0000-0000-000000000001');
  });

  afterAll(async () => {
    // 테스트 후 생성된 임시 저장 정리
    if (createdDraftIds.length > 0) {
      await supabase.from('post_drafts').delete().in('id', createdDraftIds);
    }
  });

  describe('임시 저장 작성', () => {
    it('유효한 데이터로 임시 저장을 생성할 수 있어야 함', async () => {
      const testDraft = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'case' as const,
        title: 'E2E 테스트: 임시 저장 제목',
        content: '임시 저장된 본문 내용입니다.',
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.title).toBe(testDraft.title);
      expect(data.content).toBe(testDraft.content);
      expect(data.category).toBe(testDraft.category);
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      if (data?.id) {
        createdDraftIds.push(data.id);
      }
    });

    it('빈 제목과 빈 본문으로 임시 저장을 생성할 수 있어야 함', async () => {
      const testDraft = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'qa' as const,
        title: '',
        content: '',
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe('');
      expect(data.content).toBe('');

      if (data?.id) {
        createdDraftIds.push(data.id);
      }
    });

    it('모든 카테고리(case, qa, info)로 임시 저장을 생성할 수 있어야 함', async () => {
      const categories = ['case', 'qa', 'info'] as const;

      for (const category of categories) {
        // Delete existing draft for this category to avoid unique constraint
        await supabase
          .from('post_drafts')
          .delete()
          .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
          .eq('category', category);

        const testDraft = {
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category,
          title: `E2E 테스트: ${category} 임시 저장`,
          content: `${category} 카테고리 임시 저장 내용`,
        };

        const { data, error } = await supabase
          .from('post_drafts')
          .insert(testDraft)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.category).toBe(category);

        if (data?.id) {
          createdDraftIds.push(data.id);
        }
      }
    });
  });

  describe('임시 저장 수정', () => {
    it('기존 임시 저장을 수정할 수 있어야 함', async () => {
      // Delete existing draft for 'info' category to avoid unique constraint
      await supabase
        .from('post_drafts')
        .delete()
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .eq('category', 'info');

      // 임시 저장 생성
      const { data: createData } = await supabase
        .from('post_drafts')
        .insert({
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category: 'info',
          title: '수정 전 제목',
          content: '수정 전 내용',
        })
        .select()
        .single();

      if (createData?.id) {
        createdDraftIds.push(createData.id);
      }

      // 임시 저장 수정
      const updatedTitle = '수정 후 제목';
      const updatedContent = '수정 후 내용입니다. 내용이 변경되었습니다.';

      const { data, error } = await supabase
        .from('post_drafts')
        .update({
          title: updatedTitle,
          content: updatedContent,
        })
        .eq('id', createData!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.title).toBe(updatedTitle);
      expect(data.content).toBe(updatedContent);
      expect(data.updated_at).not.toBe(createData!.updated_at);
    });

    it('임시 저장 수정 시 updated_at이 갱신되어야 함', async () => {
      // Delete existing draft for 'case' category to avoid unique constraint
      await supabase
        .from('post_drafts')
        .delete()
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .eq('category', 'case');

      // 임시 저장 생성
      const { data: createData } = await supabase
        .from('post_drafts')
        .insert({
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category: 'case',
          title: '타임스탬프 테스트',
          content: '초기 내용',
        })
        .select()
        .single();

      if (createData?.id) {
        createdDraftIds.push(createData.id);
      }

      const originalUpdatedAt = new Date(createData!.updated_at).getTime();

      // 약간의 시간 대기 (updated_at 변경 확인용)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 임시 저장 수정
      const { data } = await supabase
        .from('post_drafts')
        .update({ content: '수정된 내용' })
        .eq('id', createData!.id)
        .select()
        .single();

      const newUpdatedAt = new Date(data!.updated_at).getTime();
      expect(newUpdatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });

  describe('임시 저장 목록 조회', () => {
    it('특정 사용자의 임시 저장 목록을 조회할 수 있어야 함', async () => {
      const authorId = 'a0000000-0000-0000-0000-000000000001';

      // 임시 저장 2개 생성
      const draft1 = await supabase
        .from('post_drafts')
        .insert({
          author_id: authorId,
          category: 'case',
          title: '임시 저장 1',
          content: '내용 1',
        })
        .select()
        .single();

      const draft2 = await supabase
        .from('post_drafts')
        .insert({
          author_id: authorId,
          category: 'qa',
          title: '임시 저장 2',
          content: '내용 2',
        })
        .select()
        .single();

      if (draft1.data?.id) createdDraftIds.push(draft1.data.id);
      if (draft2.data?.id) createdDraftIds.push(draft2.data.id);

      // 임시 저장 목록 조회
      const { data, error } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('author_id', authorId)
        .order('updated_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThanOrEqual(2);

      // 모든 임시 저장이 같은 작성자에 속해야 함
      data!.forEach((draft) => {
        expect(draft.author_id).toBe(authorId);
      });
    });

    it('임시 저장 목록이 최근 수정순으로 정렬되어야 함', async () => {
      const authorId = 'a0000000-0000-0000-0000-000000000001';

      const { data } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('author_id', authorId)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (data && data.length > 1) {
        // updated_at이 내림차순으로 정렬되어 있어야 함
        for (let i = 0; i < data.length - 1; i++) {
          const current = new Date(data[i].updated_at).getTime();
          const next = new Date(data[i + 1].updated_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('임시 저장 삭제', () => {
    it('임시 저장을 삭제할 수 있어야 함', async () => {
      // Delete existing draft for 'info' category to avoid unique constraint
      await supabase
        .from('post_drafts')
        .delete()
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .eq('category', 'info');

      // 임시 저장 생성
      const { data: createData } = await supabase
        .from('post_drafts')
        .insert({
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category: 'info',
          title: '삭제할 임시 저장',
          content: '삭제 테스트',
        })
        .select()
        .single();

      const draftId = createData!.id;

      // 임시 저장 삭제
      const { error } = await supabase
        .from('post_drafts')
        .delete()
        .eq('id', draftId);

      expect(error).toBeNull();

      // 삭제 확인
      const { data: checkData } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      expect(checkData).toBeNull();
    });
  });

  describe('임시 저장 → 게시글 발행', () => {
    it('임시 저장을 게시글로 발행할 수 있어야 함', async () => {
      // Delete existing draft for 'case' category to avoid unique constraint
      await supabase
        .from('post_drafts')
        .delete()
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .eq('category', 'case');

      // 1. 임시 저장 생성
      const { data: draftData } = await supabase
        .from('post_drafts')
        .insert({
          author_id: 'a0000000-0000-0000-0000-000000000001',
          category: 'case',
          title: 'E2E 테스트: 임시 저장에서 발행',
          content: '임시 저장 내용을 게시글로 발행합니다. 최소 20자 이상이어야 합니다.',
        })
        .select()
        .single();

      if (draftData?.id) {
        createdDraftIds.push(draftData.id);
      }

      // 2. 임시 저장 내용으로 게시글 생성
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: draftData!.author_id,
          category: draftData!.category,
          title: draftData!.title,
          content: draftData!.content,
          anonymous_nickname: '익명의 테스터',
        })
        .select()
        .single();

      expect(postError).toBeNull();
      expect(postData).toBeDefined();
      expect(postData.title).toBe(draftData!.title);
      expect(postData.content).toBe(draftData!.content);
      expect(postData.category).toBe(draftData!.category);

      // 3. 게시글 발행 후 임시 저장 삭제
      if (postData?.id) {
        await supabase.from('posts').delete().eq('id', postData.id);
      }
    });
  });

  describe('필수 필드 검증', () => {
    it('author_id가 없을 때 실패해야 함', async () => {
      const testDraft = {
        category: 'case',
        title: '제목',
        content: '내용',
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('category가 없을 때 실패해야 함', async () => {
      const testDraft = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        title: '제목',
        content: '내용',
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('유효하지 않은 카테고리일 때 실패해야 함', async () => {
      const testDraft = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'invalid-category',
        title: '제목',
        content: '내용',
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('post_drafts_category_check');
    });
  });

  describe('기본값 검증', () => {
    it('임시 저장 생성 시 기본값이 올바르게 설정되어야 함', async () => {
      // Delete existing draft for 'qa' category to avoid unique constraint
      await supabase
        .from('post_drafts')
        .delete()
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .eq('category', 'qa');

      const testDraft = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'qa' as const,
        title: '기본값 테스트',
        content: '기본값 확인',
      };

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 기본값 검증
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      if (data?.id) {
        createdDraftIds.push(data.id);
      }
    });
  });

  describe('성능', () => {
    it('임시 저장 생성이 200ms 이내에 완료되어야 함', async () => {
      // Delete existing draft for 'info' category to avoid unique constraint
      await supabase
        .from('post_drafts')
        .delete()
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .eq('category', 'info');

      const testDraft = {
        author_id: 'a0000000-0000-0000-0000-000000000001',
        category: 'info' as const,
        title: '성능 테스트',
        content: '성능 테스트 내용',
      };

      const startTime = performance.now();

      const { data, error } = await supabase
        .from('post_drafts')
        .insert(testDraft)
        .select()
        .single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(200); // 200ms 이내

      if (data?.id) {
        createdDraftIds.push(data.id);
      }
    });

    it('임시 저장 목록 조회가 300ms 이내에 완료되어야 함', async () => {
      const startTime = performance.now();

      await supabase
        .from('post_drafts')
        .select('*')
        .eq('author_id', 'a0000000-0000-0000-0000-000000000001')
        .order('updated_at', { ascending: false })
        .limit(10);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(300); // 300ms 이내
    });
  });
});
