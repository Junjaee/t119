// @TEST:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 인기 검색어 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/search/popular/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: Array.from({ length: 10 }, (_, i) => ({
                query: `인기검색어${i + 1}`,
                search_count: 100 - i * 10,
              })),
              error: null,
            })
          ),
        })),
      })),
    })),
  })),
}));

describe('GET /api/search/popular - Popular Searches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return popular searches (default limit 10)', async () => {
    const request = new NextRequest('http://localhost/api/search/popular', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.searches).toBeDefined();
    expect(Array.isArray(data.searches)).toBe(true);
    expect(data.searches.length).toBeLessThanOrEqual(10);
  });

  it('should include cache headers (30 minutes)', async () => {
    const request = new NextRequest('http://localhost/api/search/popular', {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=1800');
  });
});
