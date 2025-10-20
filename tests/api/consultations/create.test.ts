// @TEST:MATCH-001 | SPEC: .moai/specs/SPEC-MATCH-001/spec.md
// 상담 시작 API 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/consultations/route';
import { UserRole } from '@/types/auth.types';
import { ReportStatus } from '@/types/report.types';
import { ConsultationStatus } from '@/lib/types/matching';

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
const mockSelectReport = vi.fn();
vi.mock('@/lib/services/matching-service', () => ({
  MatchingService: vi.fn().mockImplementation(() => ({
    selectReport: mockSelectReport,
  })),
}));

describe('POST /api/consultations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('상담 시작을 성공적으로 수행해야 한다', async () => {
    const reportId = '550e8400-e29b-41d4-a716-446655440000';
    const mockResponse = {
      consultation: {
        id: '660e8400-e29b-41d4-a716-446655440000',
        report_id: reportId,
        teacher_id: '770e8400-e29b-41d4-a716-446655440000',
        lawyer_id: '880e8400-e29b-41d4-a716-446655440000',
        status: ConsultationStatus.PENDING,
        created_at: '2025-10-20T10:00:00Z',
      },
      report: {
        id: reportId,
        status: ReportStatus.ASSIGNED,
        assigned_lawyer_id: '880e8400-e29b-41d4-a716-446655440000',
      },
    };

    mockSelectReport.mockResolvedValue(mockResponse);

    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-lawyer-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.consultation.id).toBe('660e8400-e29b-41d4-a716-446655440000');
    expect(data.consultation.status).toBe(ConsultationStatus.PENDING);
    expect(data.report.status).toBe(ReportStatus.ASSIGNED);
  });

  it('인증 토큰이 없으면 401 에러를 반환해야 한다', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('변호사 역할이 아니면 403 에러를 반환해야 한다', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-teacher-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('잘못된 요청 바디는 400 에러를 반환해야 한다', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-lawyer-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          // report_id 누락
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('이미 배정된 신고 선택 시 409 에러를 반환해야 한다', async () => {
    mockSelectReport.mockRejectedValue(new Error('Report already assigned'));

    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-lawyer-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Report already assigned');
  });

  it('존재하지 않는 신고 선택 시 404 에러를 반환해야 한다', async () => {
    mockSelectReport.mockRejectedValue(new Error('Report not found'));

    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-lawyer-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: '990e8400-e29b-41d4-a716-446655440000',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Report not found');
  });

  it('진행 중인 상담 10개 초과 시 403 에러를 반환해야 한다', async () => {
    mockSelectReport.mockRejectedValue(
      new Error('Too many active consultations')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-lawyer-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Too many active consultations');
  });

  it('신고 상태가 올바르지 않으면 400 에러를 반환해야 한다', async () => {
    mockSelectReport.mockRejectedValue(new Error('Report is not available'));

    const request = new NextRequest(
      'http://localhost:3000/api/consultations',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-lawyer-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          report_id: '550e8400-e29b-41d4-a716-446655440000', // 올바른 UUID 형식
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Report is not available');
  });
});
