// @CODE:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/api/search/history.test.ts
// 검색 이력 삭제 API 엔드포인트: DELETE /api/search/history/[id]

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteSearchHistory } from '@/lib/services/search-service';

/**
 * DELETE /api/search/history/[id] - 검색 이력 삭제
 *
 * Path Parameters:
 * - id: string (history item UUID)
 *
 * Auth: JWT required (authenticated users only)
 *
 * Response:
 * - 200: { message: "검색 이력이 삭제되었습니다." }
 * - 401: { error } (unauthorized)
 * - 500: { error } (server error)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const historyId = params.id;

    // Delete search history item
    const result = await deleteSearchHistory(supabase, userId, historyId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: '검색 이력이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete search history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
