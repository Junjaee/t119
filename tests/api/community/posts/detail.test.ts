// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 게시글 상세 조회 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/community/posts/[id]/route';
import { NextRequest } from 'next/server';

const mockPost = {
  id: 'post-123',
  category: 'case',
  title: '학부모 상담 사례',
  content: '학부모 상담 시 유의할 점을 공유합니다.',
  anonymous_nickname: '익명교사001',
  view_count: 50,
  is_popular: false,
  is_blinded: false,
  created_at: '2025-10-22T10:00:00Z',
};

const mockComments = [
  {
    id: 'comment-1',
    post_id: 'post-123',
    anonymous_nickname: '익명교사002',
    content: '좋은 정보 감사합니다.',
    created_at: '2025-10-22T11:00:00Z',
  },
];

vi.mock('@/lib/supabase/admin', () => {
  return {
    supabaseAdmin: {
      from: vi.fn((table: string) => {
        if (table === 'posts') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockPost,
                    error: null,
                  })
                ),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        } else if (table === 'comments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: mockComments,
                    error: null,
                  })
                ),
              })),
            })),
          };
        }
        return {};
      }),
    },
  };
});

describe('GET /api/community/posts/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('유효한 게시글 ID로 상세 조회 시 200 응답 및 댓글 포함', async () => {
    const request = new NextRequest(
      'http://localhost/api/community/posts/post-123',
      {
        method: 'GET',
      }
    );

    const response = await GET(request, { params: { id: 'post-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.post).toMatchObject({
      id: 'post-123',
      title: '학부모 상담 사례',
      view_count: 51, // 조회수 +1
    });
    expect(data.data.comments).toHaveLength(1);
  });

  // Note: 404 테스트는 통합 테스트에서 수행
});
