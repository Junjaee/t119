// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 토큰 갱신 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { refreshSchema } from '@/lib/validators/auth.validator';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { ZodError } from 'zod';

/**
 * POST /api/auth/refresh
 * 토큰 갱신
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = refreshSchema.parse(body);

    // 리프레시 토큰 검증
    const payload = verifyRefreshToken(validatedData.refreshToken);

    // 새로운 액세스 토큰 및 리프레시 토큰 발급
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '유효하지 않은 리프레시 토큰입니다.',
        },
      },
      { status: 401 }
    );
  }
}
