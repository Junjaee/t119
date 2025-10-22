// @CODE:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/api/search/popular.test.ts
// 인기 검색어 API 엔드포인트: GET /api/search/popular

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPopularSearches } from '@/lib/services/search-service';

/**
 * GET /api/search/popular - 인기 검색어 조회
 *
 * Query Parameters:
 * - limit?: number (default: 10, max: 20)
 *
 * Auth: Public (no authentication required)
 *
 * Response:
 * - 200: { searches: [{ query, search_count, rank }] }
 * - 500: { error } (server error)
 *
 * Cache: 30 minutes
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse limit parameter
    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    // Get popular searches
    const result = await getPopularSearches(supabase, limit);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return with cache headers (30 minutes)
    return NextResponse.json(
      { searches: result.searches },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Popular searches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
