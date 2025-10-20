// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md | TEST: tests/lib/auth/jwt.test.ts
// JWT 토큰 발급 및 검증 함수

import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types/auth.types';

/**
 * 액세스 토큰 발급
 * @param payload - JWT 페이로드 (userId, email, role, association_id)
 * @returns JWT 액세스 토큰 (만료: 24시간)
 */
export function generateAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '24h',
  });
}

/**
 * 리프레시 토큰 발급
 * @param payload - JWT 페이로드
 * @returns JWT 리프레시 토큰 (만료: 7일)
 */
export function generateRefreshToken(payload: JwtPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  });
}

/**
 * 액세스 토큰 검증
 * @param token - JWT 액세스 토큰
 * @returns 검증된 페이로드
 * @throws Invalid token 에러
 */
export function verifyAccessToken(token: string): JwtPayload & { exp?: number; iat?: number } {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  if (!token || token.trim() === '') {
    throw new Error('Invalid token');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      exp?: number;
      iat?: number;
    };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * 리프레시 토큰 검증
 * @param token - JWT 리프레시 토큰
 * @returns 검증된 페이로드
 * @throws Invalid refresh token 에러
 */
export function verifyRefreshToken(token: string): JwtPayload & { exp?: number; iat?: number } {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  if (!token || token.trim() === '') {
    throw new Error('Invalid refresh token');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      exp?: number;
      iat?: number;
    };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
}
