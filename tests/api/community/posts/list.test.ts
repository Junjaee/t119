// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 게시글 목록 조회 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/community/posts/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockPosts = [
  {
    id: 'post-1',
    category: 'case',
    title: '학부모 상담 사례',
    content: '학부모 상담 시 유의할 점을 공유합니다.',
    anonymous_nickname: '익명교사001',
    view_count: 50,
    is_popular: false,
    is_blinded: false,
    created_at: '2025-10-22T10:00:00Z',
  },
  {
    id: 'post-2',
    category: 'qa',
    title: '학습 지도 방법',
    content: '효과적인 학습 지도 방법을 알려주세요.',
    anonymous_nickname: '익명교사002',
    view_count: 120,
    is_popular: true,
    is_blinded: false,
    created_at: '2025-10-22T09:00:00Z',
  },
];

vi.mock('@/lib/supabase/admin', () => {
  const mockChain = {
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn(() =>
      Promise.resolve({
        data: mockPosts,
        error: null,
        count: 2,
      })
    ),
  };

  return {
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn(() => mockChain),
      })),
    },
  };
});

describe('GET /api/community/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('기본 목록 조회 (page=1, limit=20, latest 정렬)', async () => {
    const request = new NextRequest(
      'http://localhost/api/community/posts?page=1&limit=20&sort=latest',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.posts).toHaveLength(2);
    expect(data.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      total_pages: 1,
    });
  });

  it('카테고리 필터링 (category=case)', async () => {
    const request = new NextRequest(
      'http://localhost/api/community/posts?category=case',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.posts).toBeDefined();
  });

  it('페이지네이션 (page=2, limit=10)', async () => {
    const request = new NextRequest(
      'http://localhost/api/community/posts?page=2&limit=10',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.pagination.page).toBe(2);
    expect(data.data.pagination.limit).toBe(10);
  });

  it('인기순 정렬 (sort=popular)', async () => {
    const request = new NextRequest(
      'http://localhost/api/community/posts?sort=popular',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('limit 최대값 제한 (limit=200 → 100으로 제한)', async () => {
    const request = new NextRequest(
      'http://localhost/api/community/posts?limit=200',
      {
        method: 'GET',
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.pagination.limit).toBe(100); // Math.min(200, 100) = 100
  });
});
