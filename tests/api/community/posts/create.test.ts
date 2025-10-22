// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 게시글 작성 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/community/posts/route';
import { NextRequest } from 'next/server';

// Mock JWT
vi.mock('@/lib/auth/jwt', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'mock-token') {
      return { userId: 'user-123', role: 'teacher' };
    }
    return null;
  }),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: {
                id: 'post-123',
                category: 'case',
                title: '학부모 상담 사례',
                content: '학부모 상담 시 유의할 점을 공유합니다.',
                anonymous_nickname: '익명교사123',
                view_count: 0,
                is_popular: false,
                is_blinded: false,
                created_at: new Date().toISOString(),
              },
              error: null,
            })
          ),
        })),
      })),
    })),
  },
}));

describe('POST /api/community/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('유효한 게시글 작성 요청 시 201 응답 및 익명 닉네임 자동 부여', async () => {
    const requestBody = {
      category: 'case',
      title: '학부모 상담 사례',
      content: '학부모 상담 시 유의할 점을 공유합니다. 첫째, 경청하는 자세가 중요합니다.',
    };

    const request = new NextRequest('http://localhost/api/community/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.post).toMatchObject({
      id: expect.any(String),
      category: 'case',
      title: '학부모 상담 사례',
      anonymous_nickname: expect.stringMatching(/^익명교사\d{3}$/),
      view_count: 0,
      is_popular: false,
    });
  });

  it('제목이 5자 미만이면 400 에러', async () => {
    const requestBody = {
      category: 'qa',
      title: '짧음',
      content: '이것은 충분히 긴 본문입니다. 최소 20자를 넘어야 합니다.',
    };

    const request = new NextRequest('http://localhost/api/community/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('본문이 20자 미만이면 400 에러', async () => {
    const requestBody = {
      category: 'info',
      title: '정보 공유합니다',
      content: '너무 짧음',
    };

    const request = new NextRequest('http://localhost/api/community/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('인증되지 않은 사용자는 401 에러', async () => {
    const requestBody = {
      category: 'case',
      title: '학부모 상담 사례',
      content: '학부모 상담 시 유의할 점을 공유합니다. 충분히 긴 본문입니다.',
    };

    const request = new NextRequest('http://localhost/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Authorization 헤더 없음
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
});
