// @CODE:MATCH-001:API | SPEC: .moai/specs/SPEC-MATCH-001/spec.md | TEST: tests/api/lawyers/available-reports.test.ts
// 변호사용 미배정 신고 목록 조회 API

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types/auth.types';
import { MatchingService } from '@/lib/services/matching-service';
import { AvailableReportsQuery } from '@/lib/types/matching';

/**
 * GET /api/lawyers/available-reports
 * 미배정 신고 목록 조회
 *
 * @param request - Next.js request 객체
 * @returns 미배정 신고 목록 및 페이지네이션 정보
 *
 * @example
 * GET /api/lawyers/available-reports?category=parent&sort=created_at&order=desc&page=1&limit=20
 */
export async function GET(request: NextRequest) {
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

    // 3. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const query: AvailableReportsQuery = {};

    const category = searchParams.get('category');
    if (category) {
      query.category = category;
    }

    const sort = searchParams.get('sort');
    if (sort === 'created_at' || sort === 'incident_date') {
      query.sort = sort;
    }

    const order = searchParams.get('order');
    if (order === 'asc' || order === 'desc') {
      query.order = order;
    }

    const page = searchParams.get('page');
    if (page) {
      query.page = parseInt(page, 10);
    }

    const limit = searchParams.get('limit');
    if (limit) {
      query.limit = parseInt(limit, 10);
    }

    // 4. 서비스 호출
    const service = new MatchingService();
    const result = await service.getAvailableReports(query);

    // 5. 응답 반환
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/lawyers/available-reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
