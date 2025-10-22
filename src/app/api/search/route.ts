// @CODE:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/api/search/unified.test.ts
// 통합 검색 API 엔드포인트: GET /api/search

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchQuerySchema } from '@/lib/validators/search.validator';
import { searchUnified } from '@/lib/services/search-service';

/**
 * GET /api/search - 통합 검색
 *
 * Query Parameters:
 * - query: string (2-100 chars, required)
 * - category?: 'reports' | 'consultations' | 'posts'
 * - start_date?: string (ISO 8601)
 * - end_date?: string (ISO 8601)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 *
 * Auth: Public (no authentication required)
 *
 * Response:
 * - 200: { results, total_count, page, limit, response_time_ms }
 * - 400: { error, details } (validation failed)
 * - 500: { error } (server error)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const categoryParam = searchParams.get('category');
    const queryParams = {
      query: searchParams.get('query') || '',
      category: categoryParam ? (categoryParam as 'reports' | 'consultations' | 'posts') : undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    // Validate query parameters
    const validation = searchQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Get user ID (optional, for logging)
    const userId = req.headers.get('X-User-Id') || undefined;

    // Perform unified search
    const result = await searchUnified(supabase, validation.data, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      results: result.results,
      total_count: result.total_count,
      page: result.page,
      limit: result.limit,
      response_time_ms: result.response_time_ms,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
