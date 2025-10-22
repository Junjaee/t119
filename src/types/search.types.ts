// @CODE:SEARCH-001:DATA | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 검색 타입 정의

/**
 * 검색 결과 타입
 */
export type SearchResultType = 'report' | 'consultation' | 'post';

/**
 * 검색 결과 단일 항목
 */
export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  content: string;
  created_at: string;
  rank: number; // ts_rank score (relevance)
}

/**
 * 검색 응답 (페이지네이션 포함)
 */
export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  page: number;
  limit: number;
  response_time_ms: number;
}

/**
 * 검색 필터
 */
export interface SearchFilters {
  category?: 'reports' | 'consultations' | 'posts';
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
}

/**
 * 자동완성 결과
 */
export interface AutocompleteResult {
  query: string;
  search_count?: number; // 인기 검색어의 경우
}

/**
 * 검색 이력 항목
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
}

/**
 * 인기 검색어 항목
 */
export interface PopularSearchItem {
  query: string;
  search_count: number;
  rank: number;
}

/**
 * 검색 로그 (analytics)
 */
export interface SearchLog {
  id: string;
  user_id?: string; // NULL = anonymous
  query: string;
  filters?: SearchFilters;
  results_count: number;
  response_time_ms: number;
  created_at: string;
}
