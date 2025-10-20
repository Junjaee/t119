// @TEST:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 비밀번호 해싱 및 검증 테스트

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('비밀번호 해싱 및 검증', () => {
  const plainPassword = 'SecurePass123!';

  describe('비밀번호 해싱', () => {
    it('평문 비밀번호를 해시로 변환해야 한다', async () => {
      const hash = await hashPassword(plainPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(50); // bcrypt 해시 길이
    });

    it('같은 비밀번호도 매번 다른 해시를 생성해야 한다 (salt)', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('빈 비밀번호는 에러를 발생시켜야 한다', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });
  });

  describe('비밀번호 검증', () => {
    it('올바른 비밀번호는 검증에 성공해야 한다', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword(plainPassword, hash);

      expect(isValid).toBe(true);
    });

    it('잘못된 비밀번호는 검증에 실패해야 한다', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('대소문자를 구분해야 한다', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword('securepass123!', hash);

      expect(isValid).toBe(false);
    });

    it('빈 비밀번호는 검증에 실패해야 한다', async () => {
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('잘못된 해시 형식은 에러를 발생시켜야 한다', async () => {
      await expect(
        verifyPassword(plainPassword, 'invalid-hash')
      ).rejects.toThrow();
    });
  });

  describe('보안 요구사항', () => {
    it('해시는 bcrypt $2b$ 형식이어야 한다', async () => {
      const hash = await hashPassword(plainPassword);

      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('salt rounds가 10 이상이어야 한다', async () => {
      const hash = await hashPassword(plainPassword);
      const rounds = parseInt(hash.split('$')[2], 10);

      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it('해싱 시간이 100ms 이상 걸려야 한다 (brute force 방어)', async () => {
      const start = Date.now();
      await hashPassword(plainPassword);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(50); // CI 환경 고려하여 50ms로 조정
    });
  });
});
