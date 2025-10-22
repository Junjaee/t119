// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * useCreateComment Hook - 댓글 작성
 *
 * @SPEC:COMMUNITY-001 UR-003 (댓글 작성)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createComment } from '@/lib/services/community-service';
import type { CreateCommentInput } from '@/types/community.types';

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const result = await createComment(supabase, input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.comment;
    },
    onSuccess: (_, variables) => {
      // 해당 게시글 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['post', variables.post_id] });
    },
  });
}
