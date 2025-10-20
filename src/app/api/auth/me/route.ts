// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 사용자 정보 조회 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/auth/me
 * 현재 사용자 정보 조회
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '인증 토큰이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 토큰 검증
    const payload = verifyAccessToken(token);

    // 사용자 정보 조회
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, phone, school, position, association_id, association_approved, is_verified, is_active, nickname, created_at, last_login')
      .eq('id', payload.userId)
      .single();

    if (dbError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '사용자를 찾을 수 없습니다.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 토큰입니다.',
        },
      },
      { status: 401 }
    );
  }
}
