// @CODE:REPORT-001:API | SPEC: .moai/specs/SPEC-REPORT-001/spec.md
// 신고 API 엔드포인트: POST /api/reports, GET /api/reports

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createReportSchema, reportQuerySchema } from '@/lib/validators/report.validator';
import { createReport, getReports } from '@/lib/reports/report-service';

/**
 * POST /api/reports - 신고 생성
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const userId = req.headers.get('X-User-Id');
    const userRole = req.headers.get('X-User-Role');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 변호사는 신고 작성 불가 (middleware에서 차단하지만 이중 검증)
    if (userRole === 'lawyer') {
      return NextResponse.json(
        { error: 'Lawyers cannot create reports' },
        { status: 403 }
      );
    }

    // 요청 body 파싱
    const body = await req.json();

    // 유효성 검증
    const validation = createReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // 신고 생성
    const report = await createReport(supabase, userId, validation.data);

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports - 신고 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 사용자 인증 확인
    const userId = req.headers.get('X-User-Id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      category: searchParams.get('category') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // 유효성 검증
    const validation = reportQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    // 신고 목록 조회
    const result = await getReports(supabase, userId, validation.data);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
