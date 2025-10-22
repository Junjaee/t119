// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * useCreatePost Hook - 게시글 작성
 *
 * @SPEC:COMMUNITY-001 UR-001 (익명 게시글 작성)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createPost } from '@/lib/services/community-service';
import type { CreatePostInput } from '@/types/community.types';

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const result = await createPost(supabase, input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.post;
    },
    onSuccess: () => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
