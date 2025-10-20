// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// Next.js 미들웨어 - JWT 검증 및 RBAC

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types/auth.types';

/**
 * Next.js 미들웨어
 * - JWT 토큰 검증
 * - 역할 기반 접근 제어 (RBAC)
 */
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 인증이 필요 없는 경로 (회원가입, 로그인)
  const publicPaths = ['/api/auth/register', '/api/auth/login'];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Authorization 헤더 확인
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing token' },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 토큰 검증
    const payload = verifyAccessToken(token);

    // 요청 헤더에 사용자 정보 추가
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-User-Id', payload.userId.toString());
    requestHeaders.set('X-User-Role', payload.role);
    requestHeaders.set('X-User-Email', payload.email);

    if (payload.association_id) {
      requestHeaders.set('X-User-Association-Id', payload.association_id.toString());
    }

    // 역할 기반 접근 제어
    if (pathname.startsWith('/api/admin') && payload.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 변호사는 신고 작성 불가
    if (
      pathname.startsWith('/api/reports') &&
      req.method === 'POST' &&
      payload.role === UserRole.LAWYER
    ) {
      return NextResponse.json(
        { error: 'Forbidden: Lawyers cannot create reports' },
        { status: 403 }
      );
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid token' },
      { status: 401 }
    );
  }
}

/**
 * 미들웨어 적용 경로
 */
export const config = {
  matcher: [
    '/api/reports/:path*',
    '/api/consultations/:path*',
    '/api/admin/:path*',
    '/api/auth/me',
    '/api/auth/logout',
  ],
};
