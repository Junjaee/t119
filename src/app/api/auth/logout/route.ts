// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 로그아웃 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

/**
 * POST /api/auth/logout
 * 로그아웃
 *
 * NOTE: 현재는 클라이언트에서 토큰 삭제만 수행
 * 향후 Redis 기반 토큰 블랙리스트 구현 예정
 */
export async function POST(req: NextRequest) {
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
    verifyAccessToken(token);

    // TODO: Redis 기반 토큰 블랙리스트 추가
    // await redis.set(`blacklist:${token}`, '1', 'EX', 86400);

    return NextResponse.json(
      {
        success: true,
        message: '로그아웃되었습니다.',
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
