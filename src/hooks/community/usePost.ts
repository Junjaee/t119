// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * usePost Hook - 게시글 상세 조회
 *
 * @SPEC:COMMUNITY-001 UR-003 (게시글 상세 조회)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getPostDetail, incrementViewCount } from '@/lib/services/community-service';

export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) {
        throw new Error('postId is required');
      }

      // 조회수 증가
      await incrementViewCount(supabase, postId);

      // 게시글 상세 조회
      const result = await getPostDetail(supabase, postId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        post: result.post,
        comments: result.comments,
      };
    },
    enabled: !!postId,
  });
}
