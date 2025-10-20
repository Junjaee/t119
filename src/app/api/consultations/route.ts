// @CODE:MATCH-001:API | SPEC: .moai/specs/SPEC-MATCH-001/spec.md | TEST: tests/api/consultations/create.test.ts
// 상담 시작 (신고 선택) API

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types/auth.types';
import { MatchingService } from '@/lib/services/matching-service';

// 요청 바디 스키마
const CreateConsultationSchema = z.object({
  report_id: z.string().uuid('Invalid report ID format'),
});

/**
 * POST /api/consultations
 * 상담 시작 (변호사가 신고 선택)
 *
 * @param request - Next.js request 객체
 * @returns 생성된 상담 및 업데이트된 신고 정보
 *
 * @example
 * POST /api/consultations
 * Body: { "report_id": "550e8400-e29b-41d4-a716-446655440000" }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. JWT 인증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;

    try {
      decodedToken = verifyAccessToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 역할 검증 (변호사만 접근 가능)
    if (decodedToken.role !== UserRole.LAWYER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. 요청 바디 파싱 및 검증
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = CreateConsultationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { report_id } = validation.data;
    const lawyerId = String(decodedToken.userId);

    // 4. 서비스 호출
    const service = new MatchingService();
    const result = await service.selectReport(lawyerId, { report_id });

    // 5. 응답 반환
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/consultations:', error);

    // 비즈니스 로직 에러 처리
    if (error.message === 'Report already assigned') {
      return NextResponse.json(
        { error: 'Report already assigned' },
        { status: 409 }
      );
    }

    if (error.message === 'Report not found') {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Too many active consultations') {
      return NextResponse.json(
        { error: 'Too many active consultations' },
        { status: 403 }
      );
    }

    if (error.message === 'Report is not available') {
      return NextResponse.json(
        { error: 'Report is not available' },
        { status: 400 }
      );
    }

    // 기타 서버 에러
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
