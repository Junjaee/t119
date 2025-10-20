// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 로그인 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validators/auth.validator';
import { verifyPassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ZodError } from 'zod';

/**
 * POST /api/auth/login
 * 로그인
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 요청 본문 파싱
    const body = await req.json();

    // 2. 입력 검증
    const validatedData = loginSchema.parse(body);

    // 3. 사용자 조회
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', validatedData.email)
      .single();

    if (dbError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다.',
          },
        },
        { status: 401 }
      );
    }

    // 4. 비밀번호 검증
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다.',
          },
        },
        { status: 401 }
      );
    }

    // 5. 계정 활성화 상태 확인
    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: '비활성화된 계정입니다. 관리자에게 문의하세요.',
          },
        },
        { status: 403 }
      );
    }

    // 6. 이메일 인증 상태 확인 (선택적 경고)
    if (!user.is_verified) {
      // 경고만 하고 로그인은 허용 (PRD 요구사항에 따라 조정 가능)
      console.warn(`User ${user.email} logged in without email verification`);
    }

    // 7. 협회 승인 상태 확인 (교사, 변호사만 해당)
    if (
      (user.role === 'teacher' || user.role === 'lawyer') &&
      !user.association_approved
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PENDING_APPROVAL',
            message: '관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.',
          },
        },
        { status: 403 }
      );
    }

    // 8. JWT 토큰 발급
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      association_id: user.association_id || undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 9. last_login 업데이트
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 10. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            nickname: user.nickname,
            association_id: user.association_id,
            association_approved: user.association_approved,
            is_verified: user.is_verified,
          },
        },
      },
      { status: 200 }
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
    console.error('Login error:', error);
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
