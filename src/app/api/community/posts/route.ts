// @CODE:COMMUNITY-001:API | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | TEST: tests/api/community/posts/create.test.ts
// 게시글 작성/목록 조회 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createPostSchema } from '@/lib/validators/post.validator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateAnonymousNickname } from '@/lib/utils/nickname-generator';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * POST /api/community/posts
 * 게시글 작성 (익명 닉네임 자동 부여)
 */
export async function POST(req: NextRequest) {
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

    // 2. 요청 본문 파싱
    const body = await req.json();

    // 3. 입력 검증
    const validatedData = createPostSchema.parse(body);

    // 4. 익명 닉네임 생성
    const anonymousNickname = generateAnonymousNickname();

    // 5. 게시글 생성
    const { data: post, error: dbError } = await supabaseAdmin
      .from('posts')
      .insert({
        category: validatedData.category,
        title: validatedData.title,
        content: validatedData.content,
        author_id: payload.userId,
        anonymous_nickname: anonymousNickname,
        view_count: 0,
        is_popular: false,
        is_blinded: false,
      })
      .select()
      .single();

    if (dbError || !post) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '게시글 작성에 실패했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 6. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          post: {
            id: post.id,
            category: post.category,
            title: post.title,
            content: post.content,
            anonymous_nickname: post.anonymous_nickname,
            view_count: post.view_count,
            is_popular: post.is_popular,
            created_at: post.created_at,
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

    // JWT 검증 에러
    if (error instanceof Error && error.message.includes('jwt')) {
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

    // 기타 서버 에러
    console.error('Post creation error:', error);
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

/**
 * GET /api/community/posts
 * 게시글 목록 조회 (페이지네이션, 필터링, 정렬)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Query Parameters 파싱
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    );
    const sort = searchParams.get('sort') || 'latest';

    // 2. 페이지네이션 계산
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 3. 쿼리 빌더
    let query = supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('is_blinded', false) // 블라인드된 게시글 제외
      .range(from, to);

    // 4. 카테고리 필터
    if (category && ['case', 'qa', 'info'].includes(category)) {
      query = query.eq('category', category);
    }

    // 5. 정렬
    if (sort === 'popular') {
      query = query.order('view_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // 6. 실행
    const { data: posts, error: dbError, count } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '게시글 목록 조회에 실패했습니다.',
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
          posts: posts || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Posts list error:', error);
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
