// @CODE:SEARCH-001:DOMAIN | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md | TEST: tests/lib/services/search-service.test.ts
/**
 * 검색 서비스
 *
 * 주요 기능:
 * - 통합 검색 (신고, 상담, 커뮤니티 게시글)
 * - 자동완성 제안
 * - 인기 검색어 조회
 * - 검색 이력 관리 (max 10, FIFO)
 * - 검색 로깅 (analytics)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SearchResult,
  SearchResponse,
  AutocompleteResult,
  SearchHistoryItem,
  PopularSearchItem,
} from '@/types/search.types';

/**
 * 검색 쿼리 파라미터
 */
export interface SearchQueryParams {
  query: string;
  category?: 'reports' | 'consultations' | 'posts';
  start_date?: string;
  end_date?: string;
  page: number;
  limit: number;
}

/**
 * 통합 검색 결과 타입
 */
export type SearchUnifiedResult =
  | { success: true; results: SearchResult[]; total_count: number; page: number; limit: number; response_time_ms: number }
  | { success: false; error: string };

/**
 * 자동완성 결과 타입
 */
export type AutocompleteQueryResult =
  | { success: true; suggestions: AutocompleteResult[] }
  | { success: false; error: string };

/**
 * 인기 검색어 결과 타입
 */
export type PopularSearchesResult =
  | { success: true; searches: PopularSearchItem[] }
  | { success: false; error: string };

/**
 * 검색 이력 결과 타입
 */
export type SearchHistoryResult =
  | { success: true; history: SearchHistoryItem[] }
  | { success: false; error: string };

/**
 * 검색 이력 삭제 결과 타입
 */
export type DeleteHistoryResult =
  | { success: true }
  | { success: false; error: string };

/**
 * 통합 검색 (UR-001: 키워드 기반 검색)
 *
 * @param supabase - Supabase 클라이언트
 * @param params - 검색 파라미터
 * @param userId - 사용자 ID (optional, for logging)
 * @returns 검색 결과 및 페이지네이션 정보
 *
 * @performance C-001: 검색 결과는 500ms 이내 반환
 */
export async function searchUnified(
  supabase: SupabaseClient,
  params: SearchQueryParams,
  userId?: string
): Promise<SearchUnifiedResult> {
  const startTime = Date.now();

  try {
    // Calculate offset for pagination
    const offset = (params.page - 1) * params.limit;

    // Call unified search RPC function
    const { data, error } = await supabase.rpc('search_unified', {
      search_query: params.query,
      category_filter: params.category || null,
      limit_count: params.limit,
      offset_count: offset,
    });

    if (error) {
      return {
        success: false,
        error: `검색 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    const results: SearchResult[] = data || [];
    const response_time_ms = Date.now() - startTime;

    // ER-003: Log search query (analytics)
    await logSearch(supabase, {
      user_id: userId,
      query: params.query,
      filters: {
        category: params.category,
        start_date: params.start_date,
        end_date: params.end_date,
      },
      results_count: results.length,
      response_time_ms,
    });

    // C-004: Add to user's search history (if authenticated)
    if (userId) {
      await addToSearchHistory(supabase, userId, params.query);
    }

    return {
      success: true,
      results,
      total_count: results.length,
      page: params.page,
      limit: params.limit,
      response_time_ms,
    };
  } catch (err) {
    return {
      success: false,
      error: `검색 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 자동완성 제안 (ER-001: 검색어 입력 시 자동완성)
 *
 * @param supabase - Supabase 클라이언트
 * @param query - 검색어 (최소 1자)
 * @returns 자동완성 제안 목록 (최대 5개)
 */
export async function getAutocomplete(
  supabase: SupabaseClient,
  query: string
): Promise<AutocompleteQueryResult> {
  try {
    // Query popular_searches for suggestions
    const { data, error } = await supabase
      .from('popular_searches')
      .select('query, search_count')
      .ilike('query', `%${query}%`)
      .order('search_count', { ascending: false })
      .limit(5);

    if (error) {
      return {
        success: false,
        error: `자동완성 조회 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    const suggestions: AutocompleteResult[] = (data || []).map((item) => ({
      query: item.query,
      search_count: item.search_count,
    }));

    return {
      success: true,
      suggestions,
    };
  } catch (err) {
    return {
      success: false,
      error: `자동완성 조회 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 인기 검색어 조회
 *
 * @param supabase - Supabase 클라이언트
 * @param limit - 조회 개수 (기본 10개)
 * @returns 인기 검색어 목록
 */
export async function getPopularSearches(
  supabase: SupabaseClient,
  limit: number = 10
): Promise<PopularSearchesResult> {
  try {
    const { data, error } = await supabase
      .from('popular_searches')
      .select('query, search_count')
      .order('search_count', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: `인기 검색어 조회 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    const searches: PopularSearchItem[] = (data || []).map((item, index) => ({
      query: item.query,
      search_count: item.search_count,
      rank: index + 1,
    }));

    return {
      success: true,
      searches,
    };
  } catch (err) {
    return {
      success: false,
      error: `인기 검색어 조회 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 검색 이력 조회 (C-004: 최근 10개만 저장)
 *
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID
 * @param limit - 조회 개수 (최대 10개)
 * @returns 검색 이력 목록
 */
export async function getSearchHistory(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<SearchHistoryResult> {
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('id, query, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: `검색 이력 조회 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    const history: SearchHistoryItem[] = (data || []).map((item) => ({
      id: item.id,
      query: item.query,
      created_at: item.created_at,
    }));

    return {
      success: true,
      history,
    };
  } catch (err) {
    return {
      success: false,
      error: `검색 이력 조회 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 검색 이력 삭제
 *
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID
 * @param historyId - 이력 ID
 * @returns 삭제 결과
 */
export async function deleteSearchHistory(
  supabase: SupabaseClient,
  userId: string,
  historyId: string
): Promise<DeleteHistoryResult> {
  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', userId); // RLS policy ensures user can only delete own history

    if (error) {
      return {
        success: false,
        error: `검색 이력 삭제 중 오류가 발생했습니다: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: `검색 이력 삭제 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 검색 로그 저장 (private helper)
 *
 * @param supabase - Supabase 클라이언트
 * @param log - 로그 데이터
 */
async function logSearch(
  supabase: SupabaseClient,
  log: {
    user_id?: string;
    query: string;
    filters: {
      category?: string;
      start_date?: string;
      end_date?: string;
    };
    results_count: number;
    response_time_ms: number;
  }
): Promise<void> {
  try {
    await supabase.from('search_logs').insert({
      user_id: log.user_id || null,
      query: log.query,
      filters: log.filters,
      results_count: log.results_count,
      response_time_ms: log.response_time_ms,
    });
  } catch (err) {
    // Silently fail - logging should not break search functionality
    console.error('Failed to log search:', err);
  }
}

/**
 * 검색 이력에 추가 (FIFO, private helper)
 *
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID
 * @param query - 검색어
 */
async function addToSearchHistory(
  supabase: SupabaseClient,
  userId: string,
  query: string
): Promise<void> {
  try {
    // Upsert (update created_at if exists, otherwise insert)
    await supabase.from('search_history').upsert(
      {
        user_id: userId,
        query,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,query' }
    );
    // FIFO enforcement is handled by the database trigger
  } catch (err) {
    // Silently fail - history should not break search functionality
    console.error('Failed to add to search history:', err);
  }
}
