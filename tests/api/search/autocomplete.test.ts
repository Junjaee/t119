// @TEST:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 자동완성 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/search/autocomplete/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [
                  { query: '폭언', search_count: 100 },
                  { query: '폭행', search_count: 80 },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  })),
}));

describe('GET /api/search/autocomplete - Autocomplete Suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return autocomplete suggestions for valid query', async () => {
    const request = new NextRequest('http://localhost/api/search/autocomplete?query=폭', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toBeDefined();
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThanOrEqual(0);
    expect(data.suggestions.length).toBeLessThanOrEqual(5);
  });

  it('should reject empty query (400)', async () => {
    const request = new NextRequest('http://localhost/api/search/autocomplete?query=', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject query > 50 characters (400)', async () => {
    const longQuery = 'a'.repeat(51);
    const request = new NextRequest(`http://localhost/api/search/autocomplete?query=${longQuery}`, {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should include cache headers (5 minutes)', async () => {
    const request = new NextRequest('http://localhost/api/search/autocomplete?query=폭', {
      method: 'GET',
    });

    const response = await GET(request);

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
  });

  it('should work without authentication (public access)', async () => {
    const request = new NextRequest('http://localhost/api/search/autocomplete?query=폭', {
      method: 'GET',
      // No X-User-Id header
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
