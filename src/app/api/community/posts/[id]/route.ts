// @CODE:COMMUNITY-001:API | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 게시글 상세 조회/수정/삭제 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/community/posts/:id
 * 게시글 상세 조회 (조회수 +1)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. 게시글 조회
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '게시글을 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    // 2. 블라인드된 게시글은 접근 불가
    if (post.is_blinded) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BLINDED_POST',
            message: '신고로 인해 블라인드 처리된 게시글입니다.',
          },
        },
        { status: 403 }
      );
    }

    // 3. 댓글 목록 조회
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Comments fetch error:', commentsError);
    }

    // 4. 조회수 증가
    await supabaseAdmin
      .from('posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', id);

    // 5. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          post: {
            ...post,
            view_count: post.view_count + 1, // 증가된 조회수 반영
          },
          comments: comments || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Post detail error:', error);
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
