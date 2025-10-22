// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * useReportPost Hook - 게시글 신고
 *
 * @SPEC:COMMUNITY-001 UR-005 (부적절한 콘텐츠 신고)
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { reportPost } from '@/lib/services/community-service';
import type { ReportPostInput } from '@/types/community.types';

export function useReportPost() {
  return useMutation({
    mutationFn: async (input: ReportPostInput) => {
      const result = await reportPost(supabase, input);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.report;
    },
  });
}
