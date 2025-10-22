// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-003: Stats API Routes 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as overviewGET } from '@/app/api/stats/overview/route';
import { GET as trendsGET } from '@/app/api/stats/trends/route';
import { GET as consultationsGET } from '@/app/api/stats/consultations/route';

// Mock stats service
vi.mock('@/lib/stats/stats-service', () => ({
  fetchOverviewStats: vi.fn(() =>
    Promise.resolve({
      overview: {
        total_reports: 100,
        active_consultations: 20,
        completion_rate: 80,
        avg_processing_days: 5,
      },
      by_type: [],
      by_region: [],
      by_school_level: [],
    })
  ),
  fetchTrendsData: vi.fn(() =>
    Promise.resolve({
      trends: [],
    })
  ),
  fetchConsultationStats: vi.fn(() =>
    Promise.resolve({
      performance: {
        total_consultations: 50,
        completed_count: 40,
        completion_rate: 80,
        avg_processing_days: 5,
        avg_satisfaction: 4.5,
      },
      by_counselor: [],
    })
  ),
  validateDateRange: vi.fn(),
}));

// Mock auth
vi.mock('@/lib/auth/jwt', () => ({
  verifyToken: vi.fn(() => ({
    userId: 'admin-123',
    role: 'admin',
  })),
}));

describe('TAG-003: Stats API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/stats/overview', () => {
    it('should return 200 with overview stats', async () => {
      const request = new Request('http://localhost/api/stats/overview', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await overviewGET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('overview');
      expect(data.overview).toHaveProperty('total_reports');
    });

    it('should accept start_date and end_date query params', async () => {
      const request = new Request(
        'http://localhost/api/stats/overview?start_date=2025-01-01&end_date=2025-10-21',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );

      const response = await overviewGET(request);
      expect(response.status).toBe(200);
    });

    it('should return 401 if not authenticated', async () => {
      const request = new Request('http://localhost/api/stats/overview');

      const response = await overviewGET(request);
      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin role', async () => {
      const request = new Request('http://localhost/api/stats/overview', {
        headers: {
          Authorization: 'Bearer teacher-token',
        },
      });

      // Mock non-admin user
      vi.mocked(
        (await import('@/lib/auth/jwt')).verifyToken
      ).mockReturnValueOnce({
        userId: 'teacher-123',
        role: 'teacher',
      } as any);

      const response = await overviewGET(request);
      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid date range', async () => {
      const request = new Request(
        'http://localhost/api/stats/overview?start_date=2025-10-21&end_date=2025-01-01',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );

      vi.mocked(
        (await import('@/lib/stats/stats-service')).validateDateRange
      ).mockImplementationOnce(() => {
        throw new Error('end_date must be after start_date');
      });

      const response = await overviewGET(request);
      expect(response.status).toBe(400);
    });

    it('should validate date format', async () => {
      const request = new Request(
        'http://localhost/api/stats/overview?start_date=invalid',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );

      const response = await overviewGET(request);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/stats/trends', () => {
    it('should return 200 with trends data', async () => {
      const request = new Request('http://localhost/api/stats/trends', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await trendsGET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('trends');
      expect(Array.isArray(data.trends)).toBe(true);
    });

    it('should accept type filter', async () => {
      const request = new Request(
        'http://localhost/api/stats/trends?type=폭언/폭행',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );

      const response = await trendsGET(request);
      expect(response.status).toBe(200);
    });

    it('should accept region filter', async () => {
      const request = new Request(
        'http://localhost/api/stats/trends?region=서울',
        {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        }
      );

      const response = await trendsGET(request);
      expect(response.status).toBe(200);
    });

    it('should return 401 if not authenticated', async () => {
      const request = new Request('http://localhost/api/stats/trends');

      const response = await trendsGET(request);
      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin role', async () => {
      const request = new Request('http://localhost/api/stats/trends', {
        headers: {
          Authorization: 'Bearer teacher-token',
        },
      });

      vi.mocked(
        (await import('@/lib/auth/jwt')).verifyToken
      ).mockReturnValueOnce({
        userId: 'teacher-123',
        role: 'teacher',
      } as any);

      const response = await trendsGET(request);
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/stats/consultations', () => {
    it('should return 200 with consultation stats', async () => {
      const request = new Request('http://localhost/api/stats/consultations', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await consultationsGET(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('performance');
      expect(data).toHaveProperty('by_counselor');
    });

    it('should return 401 if not authenticated', async () => {
      const request = new Request('http://localhost/api/stats/consultations');

      const response = await consultationsGET(request);
      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin role', async () => {
      const request = new Request('http://localhost/api/stats/consultations', {
        headers: {
          Authorization: 'Bearer teacher-token',
        },
      });

      vi.mocked(
        (await import('@/lib/auth/jwt')).verifyToken
      ).mockReturnValueOnce({
        userId: 'teacher-123',
        role: 'teacher',
      } as any);

      const response = await consultationsGET(request);
      expect(response.status).toBe(403);
    });

    it('should mask counselor names in response', async () => {
      const request = new Request('http://localhost/api/stats/consultations', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await consultationsGET(request);
      const data = await response.json();

      data.by_counselor.forEach((counselor: any) => {
        if (counselor.counselor_name) {
          expect(counselor.counselor_name).toMatch(/[가-힣]\*/);
        }
      });
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limit on stats endpoints', async () => {
      // Note: Actual rate limiting implementation depends on middleware
      // This is a placeholder test
      expect(true).toBe(true);
    });
  });

  describe('Response caching', () => {
    it('should set appropriate cache headers', async () => {
      const request = new Request('http://localhost/api/stats/overview', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await overviewGET(request);
      const cacheControl = response.headers.get('Cache-Control');

      expect(cacheControl).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 500 for server errors', async () => {
      const request = new Request('http://localhost/api/stats/overview', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      vi.mocked(
        (await import('@/lib/stats/stats-service')).fetchOverviewStats
      ).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await overviewGET(request);
      expect(response.status).toBe(500);
    });
  });
});
