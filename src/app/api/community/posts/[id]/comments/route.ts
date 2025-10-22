// @CODE:COMMUNITY-001:API | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 댓글 작성 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createCommentSchema } from '@/lib/validators/comment.validator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateAnonymousNickname } from '@/lib/utils/nickname-generator';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * POST /api/community/posts/:id/comments
 * 댓글 작성 (익명 닉네임 자동 부여)
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
    const validatedData = createCommentSchema.parse(body);

    // 4. 게시글 존재 확인
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: '게시글을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 5. 익명 닉네임 생성 (게시글별 고정 - 임시)
    const anonymousNickname = generateAnonymousNickname();

    // 6. 댓글 생성
    const { data: comment, error: dbError } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        author_id: payload.userId,
        anonymous_nickname: anonymousNickname,
        content: validatedData.content,
      })
      .select()
      .single();

    if (dbError || !comment) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '댓글 작성에 실패했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 7. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          comment: {
            id: comment.id,
            post_id: comment.post_id,
            anonymous_nickname: comment.anonymous_nickname,
            content: comment.content,
            created_at: comment.created_at,
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
    console.error('Comment creation error:', error);
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
