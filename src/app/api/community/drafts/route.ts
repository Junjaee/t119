// @CODE:COMMUNITY-001:API | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 임시 저장 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createPostSchema } from '@/lib/validators/post.validator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * POST /api/community/drafts
 * 임시 저장
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

    // 3. 부분 검증 (제목/본문이 비어있어도 허용)
    const { category, title, content } = body;

    // 4. 기존 임시 저장 확인
    const { data: existingDraft } = await supabaseAdmin
      .from('post_drafts')
      .select('id')
      .eq('author_id', payload.userId)
      .single();

    let draft;

    if (existingDraft) {
      // 5-1. 기존 임시 저장 업데이트
      const { data, error: dbError } = await supabaseAdmin
        .from('post_drafts')
        .update({
          category,
          title: title || '',
          content: content || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }
      draft = data;
    } else {
      // 5-2. 새로운 임시 저장 생성
      const { data, error: dbError } = await supabaseAdmin
        .from('post_drafts')
        .insert({
          author_id: payload.userId,
          category: category || 'case',
          title: title || '',
          content: content || '',
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }
      draft = data;
    }

    // 6. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          draft: {
            id: draft.id,
            updated_at: draft.updated_at,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Draft save error:', error);
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
 * GET /api/community/drafts
 * 임시 저장 조회
 */
export async function GET(req: NextRequest) {
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

    // 2. 임시 저장 조회
    const { data: draft, error: dbError } = await supabaseAdmin
      .from('post_drafts')
      .select('*')
      .eq('author_id', payload.userId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116: No rows found (정상)
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '임시 저장 조회에 실패했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 3. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          draft: draft || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Draft fetch error:', error);
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
