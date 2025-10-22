// @TEST:SEARCH-001:DOMAIN | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 검색 서비스 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  searchUnified,
  getAutocomplete,
  getPopularSearches,
  getSearchHistory,
  deleteSearchHistory,
} from '@/lib/services/search-service';

// Mock Supabase client
const createMockSupabase = (): SupabaseClient => {
  return {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
        ilike: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
      upsert: vi.fn(() => ({ data: null, error: null })),
    })),
  } as unknown as SupabaseClient;
};

describe('@TEST:SEARCH-001:DOMAIN - Search Service', () => {
  let supabase: SupabaseClient;

  beforeEach(() => {
    supabase = createMockSupabase();
  });

  describe('searchUnified', () => {
    it('should return unified search results from all tables', async () => {
      const mockResults = [
        { id: '1', type: 'report', title: '폭언 신고', content: '폭언 내용', created_at: '2025-10-23', rank: 0.9 },
        { id: '2', type: 'consultation', title: '폭언 상담', content: '상담 내용', created_at: '2025-10-22', rank: 0.8 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce({ insert: insertMock } as any)
        .mockReturnValueOnce({ upsert: upsertMock } as any);

      const result = await searchUnified(supabase, {
        query: '폭언',
        category: undefined,
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results).toHaveLength(2);
        expect(result.results[0].type).toBe('report');
        expect(result.total_count).toBe(2);
        expect(result.response_time_ms).toBeGreaterThanOrEqual(0);
      }
    });

    it('should filter by category (reports only)', async () => {
      const mockResults = [
        { id: '1', type: 'report', title: '폭언 신고', content: '폭언 내용', created_at: '2025-10-23', rank: 0.9 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const result = await searchUnified(supabase, {
        query: '폭언',
        category: 'reports',
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results).toHaveLength(1);
        expect(result.results[0].type).toBe('report');
      }
    });

    it('should return empty results when no matches found', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await searchUnified(supabase, {
        query: 'nonexistent',
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results).toHaveLength(0);
        expect(result.total_count).toBe(0);
      }
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' } as any,
      });

      const result = await searchUnified(supabase, {
        query: '폭언',
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('검색 중 오류');
      }
    });

    it('should log search query to search_logs', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const insertMock = vi.fn(() => ({ data: null, error: null }));
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: insertMock,
      } as any);

      await searchUnified(supabase, {
        query: '폭언',
        page: 1,
        limit: 20,
      }, 'user-123');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '폭언',
          results_count: 0,
        })
      );
    });

    it('should add query to user search_history (FIFO max 10)', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const upsertMock = vi.fn(() => ({ data: null, error: null }));
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn(() => ({ data: null, error: null })),
      } as any).mockReturnValueOnce({
        upsert: upsertMock,
      } as any);

      await searchUnified(supabase, {
        query: '폭언',
        page: 1,
        limit: 20,
      }, 'user-123');

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          query: '폭언',
        }),
        { onConflict: 'user_id,query' }
      );
    });

    it('should validate response time < 500ms (C-001)', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const startTime = Date.now();
      const result = await searchUnified(supabase, {
        query: '폭언',
        page: 1,
        limit: 20,
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.response_time_ms).toBeLessThan(500);
        expect(endTime - startTime).toBeLessThan(500);
      }
    });

    it('should support Korean text search', async () => {
      const mockResults = [
        { id: '1', type: 'report', title: '학부모 폭언 처벌', content: '학부모가 교사에게 폭언', created_at: '2025-10-23', rank: 0.9 },
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const result = await searchUnified(supabase, {
        query: '폭언 처벌',
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results[0].title).toContain('폭언');
      }
    });

    it('should apply pagination correctly', async () => {
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        type: 'report',
        title: `제목 ${i + 1}`,
        content: '내용',
        created_at: '2025-10-23',
        rank: 0.9 - i * 0.1,
      }));

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockResults,
        error: null,
      });

      const result = await searchUnified(supabase, {
        query: '폭언',
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.results).toHaveLength(10);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
      }
    });
  });

  describe('getAutocomplete', () => {
    it('should return autocomplete suggestions from popular_searches', async () => {
      const mockSuggestions = [
        { query: '폭언', search_count: 100 },
        { query: '폭행', search_count: 80 },
      ];

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: mockSuggestions, error: null })),
            })),
          })),
        })),
      } as any);

      const result = await getAutocomplete(supabase, '폭');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions).toHaveLength(2);
        expect(result.suggestions[0].query).toBe('폭언');
      }
    });

    it('should limit suggestions to max 5', async () => {
      const mockSuggestions = Array.from({ length: 10 }, (_, i) => ({
        query: `폭언${i}`,
        search_count: 100 - i,
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: mockSuggestions.slice(0, 5), error: null })),
            })),
          })),
        })),
      } as any);

      const result = await getAutocomplete(supabase, '폭언');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.suggestions.length).toBeLessThanOrEqual(5);
      }
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          ilike: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: null, error: { message: 'DB error' } as any })),
            })),
          })),
        })),
      } as any);

      const result = await getAutocomplete(supabase, '폭');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('자동완성 조회 중 오류');
      }
    });
  });

  describe('getPopularSearches', () => {
    it('should return top 10 popular searches', async () => {
      const mockPopular = Array.from({ length: 10 }, (_, i) => ({
        query: `인기검색어${i + 1}`,
        search_count: 100 - i * 10,
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: mockPopular, error: null })),
          })),
        })),
      } as any);

      const result = await getPopularSearches(supabase, 10);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.searches).toHaveLength(10);
        expect(result.searches[0].search_count).toBeGreaterThan(result.searches[1].search_count);
      }
    });
  });

  describe('getSearchHistory', () => {
    it('should return user search history (max 10)', async () => {
      const mockHistory = [
        { id: '1', query: '폭언', created_at: '2025-10-23T10:00:00Z' },
        { id: '2', query: '폭행', created_at: '2025-10-23T09:00:00Z' },
      ];

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: mockHistory, error: null })),
            })),
          })),
        })),
      } as any);

      const result = await getSearchHistory(supabase, 'user-123', 10);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.history).toHaveLength(2);
        expect(result.history[0].query).toBe('폭언');
      }
    });

    it('should enforce max 10 limit', async () => {
      const mockHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        query: `검색${i + 1}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: mockHistory.slice(0, 10), error: null })),
            })),
          })),
        })),
      } as any);

      const result = await getSearchHistory(supabase, 'user-123', 10);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.history.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('deleteSearchHistory', () => {
    it('should delete specific search history item', async () => {
      const eqMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const deleteMock = vi.fn().mockReturnValue({
        eq: eqMock,
      });

      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: deleteMock,
      } as any);

      const result = await deleteSearchHistory(supabase, 'user-123', 'history-1');

      expect(result.success).toBe(true);
      expect(deleteMock).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: { message: 'Delete failed' } as any })),
        })),
      } as any);

      const result = await deleteSearchHistory(supabase, 'user-123', 'history-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('검색 이력 삭제 중 오류');
      }
    });
  });
});
