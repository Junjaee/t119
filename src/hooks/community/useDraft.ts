// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * useDraft Hook - 임시 저장 조회 및 저장
 *
 * @SPEC:COMMUNITY-001 SR-002 (30초마다 자동 저장)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getDraft, saveDraft } from '@/lib/services/community-service';
import type { PostCategory, SaveDraftInput } from '@/types/community.types';

/**
 * 임시 저장 조회 Hook
 */
export function useDraft(category: PostCategory) {
  return useQuery({
    queryKey: ['draft', category],
    queryFn: async () => {
      const result = await getDraft(supabase, category);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.draft;
    },
  });
}

/**
 * 임시 저장 Mutation Hook
 */
export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveDraftInput) => {
      const result = await saveDraft(supabase, input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.draft;
    },
    onSuccess: (data) => {
      // 해당 카테고리 임시 저장 캐시 업데이트
      queryClient.setQueryData(['draft', data.category], data);
    },
  });
}
