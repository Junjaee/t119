// @TEST:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 익명화 로직 테스트

import { describe, it, expect, beforeEach } from 'vitest';
import { generateNickname, hashIp, maskName, maskSchool } from '@/lib/auth/anonymize';
import { UserRole } from '@/types/auth.types';

describe('익명화 로직', () => {
  beforeEach(() => {
    process.env.IP_SALT = 'test-salt-for-ip-hashing';
  });

  describe('닉네임 생성', () => {
    it('교사 역할에 대해 "익명교사XXXX" 형식을 생성해야 한다', () => {
      const nickname = generateNickname(UserRole.TEACHER);

      expect(nickname).toMatch(/^익명교사\d{4}$/);
    });

    it('변호사 역할에 대해 "익명변호사XXXX" 형식을 생성해야 한다', () => {
      const nickname = generateNickname(UserRole.LAWYER);

      expect(nickname).toMatch(/^익명변호사\d{4}$/);
    });

    it('관리자 역할에 대해 "관리자XXXX" 형식을 생성해야 한다', () => {
      const nickname = generateNickname(UserRole.ADMIN);

      expect(nickname).toMatch(/^관리자\d{4}$/);
    });

    it('4자리 숫자는 1000~9999 범위여야 한다', () => {
      const nickname = generateNickname(UserRole.TEACHER);
      const suffix = parseInt(nickname.replace('익명교사', ''), 10);

      expect(suffix).toBeGreaterThanOrEqual(1000);
      expect(suffix).toBeLessThan(10000);
    });

    it('매번 다른 닉네임을 생성해야 한다 (높은 확률)', () => {
      const nicknames = new Set<string>();

      for (let i = 0; i < 10; i++) {
        nicknames.add(generateNickname(UserRole.TEACHER));
      }

      expect(nicknames.size).toBeGreaterThan(1);
    });
  });

  describe('IP 해싱', () => {
    const testIp = '192.168.1.100';

    it('IP 주소를 SHA-256 해시로 변환해야 한다', () => {
      const hash = hashIp(testIp);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 hex 길이
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('같은 IP는 같은 해시를 생성해야 한다', () => {
      const hash1 = hashIp(testIp);
      const hash2 = hashIp(testIp);

      expect(hash1).toBe(hash2);
    });

    it('다른 IP는 다른 해시를 생성해야 한다', () => {
      const hash1 = hashIp('192.168.1.100');
      const hash2 = hashIp('192.168.1.101');

      expect(hash1).not.toBe(hash2);
    });

    it('원본 IP를 추론할 수 없어야 한다', () => {
      const hash = hashIp(testIp);

      expect(hash).not.toContain('192');
      expect(hash).not.toContain('168');
      expect(hash).not.toContain('100');
    });

    it('빈 IP는 에러를 발생시켜야 한다', () => {
      expect(() => hashIp('')).toThrow('IP address cannot be empty');
    });
  });

  describe('이름 마스킹', () => {
    it('2자 이름은 그대로 반환해야 한다', () => {
      expect(maskName('김철')).toBe('김철');
    });

    it('3자 이름은 "김**" 형식으로 마스킹해야 한다', () => {
      expect(maskName('김철수')).toBe('김**');
    });

    it('4자 이름은 "김***" 형식으로 마스킹해야 한다', () => {
      expect(maskName('김철수영')).toBe('김***');
    });

    it('빈 이름은 빈 문자열을 반환해야 한다', () => {
      expect(maskName('')).toBe('');
    });
  });

  describe('학교명 마스킹', () => {
    it('4자 이하 학교명은 그대로 반환해야 한다', () => {
      expect(maskSchool('서울초')).toBe('서울초');
    });

    it('5자 이상 학교명은 "서울*초등학교" 형식으로 마스킹해야 한다', () => {
      // "서울중앙초등학교" = 8자 → 앞2자 + 마스킹(8-6=2) + 뒤4자 = "서울**초등학교"
      expect(maskSchool('서울중앙초등학교')).toBe('서울**초등학교');
    });

    it('긴 학교명도 올바르게 마스킹해야 한다', () => {
      const schoolName = '서울특별시강남구역삼초등학교';
      const masked = maskSchool(schoolName);

      expect(masked.startsWith('서울')).toBe(true);
      expect(masked.endsWith('초등학교')).toBe(true);
      expect(masked).toContain('*');
    });

    it('빈 학교명은 빈 문자열을 반환해야 한다', () => {
      expect(maskSchool('')).toBe('');
    });
  });

  describe('통합 익명화', () => {
    it('교사 정보를 완전히 익명화해야 한다', () => {
      const nickname = generateNickname(UserRole.TEACHER);
      const ipHash = hashIp('192.168.1.100');
      const maskedName = maskName('김철수');
      const maskedSchool = maskSchool('서울중앙초등학교');

      expect(nickname).toMatch(/^익명교사\d{4}$/);
      expect(ipHash.length).toBe(64);
      expect(maskedName).toBe('김**');
      expect(maskedSchool).toBe('서울**초등학교');
    });

    it('변호사 정보를 완전히 익명화해야 한다', () => {
      const nickname = generateNickname(UserRole.LAWYER);
      const ipHash = hashIp('192.168.1.100');
      const maskedName = maskName('이영희');

      expect(nickname).toMatch(/^익명변호사\d{4}$/);
      expect(ipHash.length).toBe(64);
      expect(maskedName).toBe('이**');
    });
  });
});
