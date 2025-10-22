// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | TEST: tests/hooks/community/usePosts.test.ts
/**
 * usePosts Hook - 게시글 목록 조회
 *
 * @SPEC:COMMUNITY-001 UR-002 (카테고리별 게시판)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getPostList } from '@/lib/services/community-service';
import type { GetPostListParams } from '@/types/community.types';

export interface UsePostsParams extends GetPostListParams {}

export function usePosts(params: UsePostsParams) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: async () => {
      const result = await getPostList(supabase, params);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        posts: result.posts,
        total: result.total,
      };
    },
  });
}
