// @CODE:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/api/search/autocomplete.test.ts
// 자동완성 API 엔드포인트: GET /api/search/autocomplete

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autocompleteSchema } from '@/lib/validators/search.validator';
import { getAutocomplete } from '@/lib/services/search-service';

/**
 * GET /api/search/autocomplete - 자동완성 제안
 *
 * Query Parameters:
 * - query: string (1-50 chars, required)
 *
 * Auth: Public (no authentication required)
 *
 * Response:
 * - 200: { suggestions: [{ query, search_count }] }
 * - 400: { error, details } (validation failed)
 * - 500: { error } (server error)
 *
 * Cache: 5 minutes
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameter
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';

    // Validate query
    const validation = autocompleteSchema.safeParse({ query });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Get autocomplete suggestions
    const result = await getAutocomplete(supabase, validation.data.query);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return with cache headers (5 minutes)
    return NextResponse.json(
      { suggestions: result.suggestions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
