// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// usePosts Hook 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePosts } from '@/hooks/community/usePosts';
import type { ReactNode } from 'react';

// Mock service layer
vi.mock('@/lib/services/community-service', () => ({
  getPostList: vi.fn(),
}));

import { getPostList } from '@/lib/services/community-service';

describe('usePosts Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('게시글 목록 조회 (UR-002)', () => {
    it('성공 시 게시글 목록을 반환해야 한다', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          category: 'case' as const,
          title: '테스트 게시글',
          content: '테스트 내용입니다',
          author_id: 'user-1',
          anonymous_nickname: '익명교사001',
          view_count: 10,
          is_popular: false,
          is_blinded: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(getPostList).mockResolvedValue({
        success: true,
        posts: mockPosts,
        total: 1,
      });

      const { result } = renderHook(() => usePosts({}), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.posts).toEqual(mockPosts);
      expect(result.current.data?.total).toBe(1);
    });

    it('카테고리 필터링이 가능해야 한다', async () => {
      vi.mocked(getPostList).mockResolvedValue({
        success: true,
        posts: [],
        total: 0,
      });

      const { result } = renderHook(() => usePosts({ category: 'qa' }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getPostList).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ category: 'qa' })
      );
    });

    it('페이지네이션이 작동해야 한다', async () => {
      vi.mocked(getPostList).mockResolvedValue({
        success: true,
        posts: [],
        total: 0,
      });

      const { result } = renderHook(() => usePosts({ page: 2, limit: 10 }), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(getPostList).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ page: 2, limit: 10 })
      );
    });

    it('실패 시 에러를 반환해야 한다', async () => {
      vi.mocked(getPostList).mockResolvedValue({
        success: false,
        error: '조회 실패',
      });

      const { result } = renderHook(() => usePosts({}), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });
});
