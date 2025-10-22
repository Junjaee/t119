// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-007: PDF API Route 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stats/reports/pdf/route';

// Mock PDF generator
vi.mock('@/lib/pdf/pdf-generator', () => ({
  generateStatsReport: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
  uploadPDFToStorage: vi.fn(() =>
    Promise.resolve({
      pdf_url: 'https://example.com/report.pdf',
      file_name: 'report.pdf',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ),
  generateReportFileName: vi.fn(() => 'report-123.pdf'),
}));

// Mock auth
vi.mock('@/lib/auth/jwt', () => ({
  verifyToken: vi.fn(() => ({
    userId: 'admin-123',
    role: 'admin',
  })),
}));

describe('TAG-007: PDF API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/stats/reports/pdf', () => {
    it('should return 200 with PDF URL', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          start_date: '2025-01-01',
          end_date: '2025-10-21',
          include_charts: ['type', 'region'],
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('pdf_url');
      expect(data).toHaveProperty('file_name');
      expect(data).toHaveProperty('expires_at');
    });

    it('should return 401 if not authenticated', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: '2025-01-01',
          end_date: '2025-10-21',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 403 if not admin role', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer teacher-token',
        },
        body: JSON.stringify({
          start_date: '2025-01-01',
          end_date: '2025-10-21',
        }),
      });

      vi.mocked(
        (await import('@/lib/auth/jwt')).verifyToken
      ).mockReturnValueOnce({
        userId: 'teacher-123',
        role: 'teacher',
      } as any);

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should accept optional title', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          start_date: '2025-01-01',
          end_date: '2025-10-21',
          title: '사용자 정의 리포트',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should validate date format', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          start_date: 'invalid',
          end_date: '2025-10-21',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle server errors', async () => {
      const request = new Request('http://localhost/api/stats/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          start_date: '2025-01-01',
          end_date: '2025-10-21',
        }),
      });

      vi.mocked(
        (await import('@/lib/pdf/pdf-generator')).generateStatsReport
      ).mockRejectedValueOnce(new Error('PDF generation failed'));

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
