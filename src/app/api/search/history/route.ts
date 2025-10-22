// @CODE:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/api/search/history.test.ts
// 검색 이력 API 엔드포인트: GET /api/search/history

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSearchHistory } from '@/lib/services/search-service';

/**
 * GET /api/search/history - 검색 이력 조회
 *
 * Query Parameters:
 * - limit?: number (default: 10, max: 10)
 *
 * Auth: JWT required (authenticated users only)
 *
 * Response:
 * - 200: { history: [{ id, query, created_at }] }
 * - 401: { error } (unauthorized)
 * - 500: { error } (server error)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse limit parameter (max 10)
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 10);

    // Get search history
    const result = await getSearchHistory(supabase, userId, limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ history: result.history });
  } catch (error) {
    console.error('Search history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
