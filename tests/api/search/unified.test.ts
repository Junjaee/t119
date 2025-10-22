// @TEST:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 통합 검색 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/search/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(() =>
      Promise.resolve({
        data: [
          { id: '1', type: 'report', title: '폭언 신고', content: '내용', created_at: '2025-10-23', rank: 0.9 },
          { id: '2', type: 'consultation', title: '폭언 상담', content: '내용', created_at: '2025-10-22', rank: 0.8 },
        ],
        error: null,
      })
    ),
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

describe('GET /api/search - Unified Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search results for valid query', async () => {
    const request = new NextRequest('http://localhost/api/search?query=teacher&page=1&limit=20', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.total_count).toBeGreaterThanOrEqual(0);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
    expect(data.response_time_ms).toBeGreaterThanOrEqual(0);
  });

  it('should filter by category (reports)', async () => {
    const request = new NextRequest('http://localhost/api/search?query=report&category=reports', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });

  it('should reject query less than 2 characters (400)', async () => {
    const request = new NextRequest('http://localhost/api/search?query=a', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeDefined();
  });

  it('should reject query more than 100 characters (400)', async () => {
    const longQuery = 'a'.repeat(101);
    const request = new NextRequest(`http://localhost/api/search?query=${longQuery}`, {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject XSS attempts (HTML tags)', async () => {
    const request = new NextRequest('http://localhost/api/search?query=<script>alert("XSS")</script>', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should reject invalid category', async () => {
    const request = new NextRequest('http://localhost/api/search?query=폭언&category=invalid', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('should apply default pagination (page=1, limit=20)', async () => {
    const request = new NextRequest('http://localhost/api/search?query=test', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(20);
  });

  it('should accept custom pagination', async () => {
    const request = new NextRequest('http://localhost/api/search?query=test&page=2&limit=10', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
  });

  it('should return empty results when no matches found', async () => {
    vi.mocked(await import('@/lib/supabase/server')).createClient.mockReturnValueOnce({
      rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
      from: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    } as any);

    const request = new NextRequest('http://localhost/api/search?query=nonexistent', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(0);
    expect(data.total_count).toBe(0);
  });

  it('should work without authentication (public access)', async () => {
    const request = new NextRequest('http://localhost/api/search?query=public', {
      method: 'GET',
      // No X-User-Id header
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });
});
