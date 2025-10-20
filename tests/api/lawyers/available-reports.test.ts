// @TEST:MATCH-001 | SPEC: .moai/specs/SPEC-MATCH-001/spec.md
// 미배정 신고 목록 조회 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/lawyers/available-reports/route';
import { UserRole } from '@/types/auth.types';
import { ReportCategory } from '@/types/report.types';

// JWT 검증 모킹
vi.mock('@/lib/auth/jwt', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'valid-lawyer-token') {
      return {
        userId: 'lawyer-123',
        email: 'lawyer@example.com',
        role: UserRole.LAWYER,
      };
    }
    if (token === 'valid-teacher-token') {
      return {
        userId: 'teacher-456',
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
      };
    }
    throw new Error('Invalid token');
  }),
}));

// MatchingService 모킹
const mockGetAvailableReports = vi.fn();
vi.mock('@/lib/services/matching-service', () => ({
  MatchingService: vi.fn().mockImplementation(() => ({
    getAvailableReports: mockGetAvailableReports,
  })),
}));

describe('GET /api/lawyers/available-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('미배정 신고 목록을 성공적으로 조회해야 한다', async () => {
    const mockReports = {
      reports: [
        {
          id: 'report-1',
          title: '학부모 민원 테스트',
          category: ReportCategory.PARENT,
          incident_date: '2025-10-15',
          created_at: '2025-10-15T10:00:00Z',
          teacher: {
            name: '홍길동',
            anonymous_nickname: '익명교사123',
          },
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
    };

    mockGetAvailableReports.mockResolvedValue(mockReports);

    const request = new NextRequest(
      'http://localhost:3000/api/lawyers/available-reports',
      {
        headers: {
          authorization: 'Bearer valid-lawyer-token',
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.reports).toHaveLength(1);
    expect(data.reports[0].id).toBe('report-1');
    expect(data.pagination.total).toBe(1);
  });

  it('인증 토큰이 없으면 401 에러를 반환해야 한다', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/lawyers/available-reports'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('변호사 역할이 아니면 403 에러를 반환해야 한다', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/lawyers/available-reports',
      {
        headers: {
          authorization: 'Bearer valid-teacher-token',
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('카테고리 필터링이 동작해야 한다', async () => {
    const mockReports = {
      reports: [
        {
          id: 'report-1',
          title: '학부모 민원 테스트',
          category: ReportCategory.PARENT,
          incident_date: '2025-10-15',
          created_at: '2025-10-15T10:00:00Z',
          teacher: {
            name: '홍길동',
            anonymous_nickname: '익명교사123',
          },
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      },
    };

    mockGetAvailableReports.mockResolvedValue(mockReports);

    const request = new NextRequest(
      'http://localhost:3000/api/lawyers/available-reports?category=parent',
      {
        headers: {
          authorization: 'Bearer valid-lawyer-token',
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetAvailableReports).toHaveBeenCalledWith({
      category: 'parent',
    });
  });

  it('정렬 및 페이지네이션 옵션이 동작해야 한다', async () => {
    const mockReports = {
      reports: [],
      pagination: {
        total: 0,
        page: 2,
        limit: 10,
        total_pages: 0,
      },
    };

    mockGetAvailableReports.mockResolvedValue(mockReports);

    const request = new NextRequest(
      'http://localhost:3000/api/lawyers/available-reports?sort=incident_date&order=asc&page=2&limit=10',
      {
        headers: {
          authorization: 'Bearer valid-lawyer-token',
        },
      }
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockGetAvailableReports).toHaveBeenCalledWith({
      sort: 'incident_date',
      order: 'asc',
      page: 2,
      limit: 10,
    });
  });

  it('서비스 에러 발생 시 500 에러를 반환해야 한다', async () => {
    mockGetAvailableReports.mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/lawyers/available-reports',
      {
        headers: {
          authorization: 'Bearer valid-lawyer-token',
        },
      }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
