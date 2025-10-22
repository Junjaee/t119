// @TEST:SEARCH-001:API | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md
// 검색 이력 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/search/history/route';
import { DELETE } from '@/app/api/search/history/[id]/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: '1', query: '폭언', created_at: '2025-10-23T10:00:00Z' },
                  { id: '2', query: '폭행', created_at: '2025-10-23T09:00:00Z' },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

describe('GET /api/search/history - Search History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search history for authenticated user', async () => {
    const request = new NextRequest('http://localhost/api/search/history', {
      method: 'GET',
      headers: {
        'X-User-Id': 'user-123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.history).toBeDefined();
    expect(Array.isArray(data.history)).toBe(true);
  });

  it('should reject unauthenticated request (401)', async () => {
    const request = new NextRequest('http://localhost/api/search/history', {
      method: 'GET',
      // No X-User-Id header
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should enforce max 10 limit', async () => {
    const request = new NextRequest('http://localhost/api/search/history?limit=20', {
      method: 'GET',
      headers: {
        'X-User-Id': 'user-123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.history.length).toBeLessThanOrEqual(10);
  });
});

describe('DELETE /api/search/history/[id] - Delete Search History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete search history item for authenticated user', async () => {
    const request = new NextRequest('http://localhost/api/search/history/history-1', {
      method: 'DELETE',
      headers: {
        'X-User-Id': 'user-123',
      },
    });

    const response = await DELETE(request, { params: { id: 'history-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('검색 이력이 삭제되었습니다.');
  });

  it('should reject unauthenticated delete request (401)', async () => {
    const request = new NextRequest('http://localhost/api/search/history/history-1', {
      method: 'DELETE',
      // No X-User-Id header
    });

    const response = await DELETE(request, { params: { id: 'history-1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});
