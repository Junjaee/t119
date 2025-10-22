// @CODE:COMMUNITY-001:API | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 게시글 신고 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createReportSchema } from '@/lib/validators/report.validator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * POST /api/community/posts/:id/report
 * 게시글 신고 (3회 이상 시 자동 블라인드)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '유효하지 않은 토큰입니다.',
          },
        },
        { status: 401 }
      );
    }

    const { id: postId } = params;

    // 2. 요청 본문 파싱
    const body = await req.json();

    // 3. 입력 검증
    const validatedData = createReportSchema.parse(body);

    // 4. 중복 신고 확인 (같은 사용자는 1회만)
    const { data: existingReport } = await supabaseAdmin
      .from('post_reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reporter_id', payload.userId)
      .single();

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_REPORTED',
            message: '이미 신고한 게시글입니다.',
          },
        },
        { status: 400 }
      );
    }

    // 5. 신고 생성
    const { data: report, error: dbError } = await supabaseAdmin
      .from('post_reports')
      .insert({
        post_id: postId,
        reporter_id: payload.userId,
        reason: validatedData.reason,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError || !report) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '신고 처리에 실패했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 6. 신고 횟수 확인 (3회 이상 시 자동 블라인드)
    const { count } = await supabaseAdmin
      .from('post_reports')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (count && count >= 3) {
      await supabaseAdmin
        .from('posts')
        .update({ is_blinded: true })
        .eq('id', postId);
    }

    // 7. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          report: {
            id: report.id,
            status: report.status,
            created_at: report.created_at,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || '입력 값이 올바르지 않습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 기타 서버 에러
    console.error('Report creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
