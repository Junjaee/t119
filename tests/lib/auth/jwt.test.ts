// @TEST:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// JWT 토큰 발급 및 검증 테스트

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/auth/jwt';
import { UserRole } from '@/types/auth.types';

describe('JWT 토큰 발급 및 검증', () => {
  const mockPayload = {
    userId: 123,
    email: 'teacher@example.com',
    role: UserRole.TEACHER,
  };

  beforeEach(() => {
    // JWT_SECRET 환경 변수 설정
    process.env.JWT_SECRET = 'test-secret-key-256bit-minimum-length-required-for-security';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-256bit-minimum-length-required';
  });

  describe('액세스 토큰 발급', () => {
    it('유효한 페이로드로 액세스 토큰을 발급해야 한다', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT 형식: header.payload.signature
    });

    it('만료 시간이 24시간으로 설정되어야 한다', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.exp).toBeDefined();

      // 현재 시간 + 24시간 (오차 범위 1분)
      const expectedExp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      expect(decoded.exp).toBeGreaterThan(expectedExp - 60);
      expect(decoded.exp).toBeLessThan(expectedExp + 60);
    });
  });

  describe('액세스 토큰 검증', () => {
    it('발급된 토큰을 성공적으로 검증해야 한다', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('잘못된 토큰은 에러를 발생시켜야 한다', () => {
      expect(() => {
        verifyAccessToken('invalid.token.string');
      }).toThrow('Invalid token');
    });

    it('빈 토큰은 에러를 발생시켜야 한다', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow('Invalid token');
    });

    it('만료된 토큰은 에러를 발생시켜야 한다', async () => {
      // JWT_SECRET을 사용하여 만료된 토큰 생성
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        mockPayload,
        process.env.JWT_SECRET!,
        { expiresIn: '0s' } // 즉시 만료
      );

      // 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow();
    });
  });

  describe('리프레시 토큰 발급', () => {
    it('유효한 페이로드로 리프레시 토큰을 발급해야 한다', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('만료 시간이 7일로 설정되어야 한다', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.exp).toBeDefined();

      // 현재 시간 + 7일 (오차 범위 1분)
      const expectedExp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      expect(decoded.exp).toBeGreaterThan(expectedExp - 60);
      expect(decoded.exp).toBeLessThan(expectedExp + 60);
    });
  });

  describe('리프레시 토큰 검증', () => {
    it('발급된 리프레시 토큰을 성공적으로 검증해야 한다', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('잘못된 리프레시 토큰은 에러를 발생시켜야 한다', () => {
      expect(() => {
        verifyRefreshToken('invalid.refresh.token');
      }).toThrow('Invalid refresh token');
    });
  });

  describe('역할별 토큰 발급', () => {
    it('교사 역할 토큰을 발급해야 한다', () => {
      const teacherPayload = {
        userId: 1,
        email: 'teacher@example.com',
        role: UserRole.TEACHER,
        association_id: 1,
      };

      const token = generateAccessToken(teacherPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.role).toBe(UserRole.TEACHER);
      expect(decoded.association_id).toBe(1);
    });

    it('변호사 역할 토큰을 발급해야 한다', () => {
      const lawyerPayload = {
        userId: 2,
        email: 'lawyer@example.com',
        role: UserRole.LAWYER,
      };

      const token = generateAccessToken(lawyerPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.role).toBe(UserRole.LAWYER);
    });

    it('관리자 역할 토큰을 발급해야 한다', () => {
      const adminPayload = {
        userId: 3,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const token = generateAccessToken(adminPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.role).toBe(UserRole.ADMIN);
    });
  });
});
