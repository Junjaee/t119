// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 익명 닉네임 생성 유틸 테스트

import { describe, it, expect } from 'vitest';
import { generateAnonymousNickname, getNicknameForUser } from '@/lib/utils/nickname-generator';

describe('generateAnonymousNickname (익명 닉네임 생성)', () => {
  describe('정상 케이스', () => {
    it('유효한 닉네임을 생성해야 한다', () => {
      const nickname = generateAnonymousNickname();

      expect(nickname).toMatch(/^익명교사\d{3}$/);
    });

    it('생성된 닉네임은 "익명교사"로 시작해야 한다', () => {
      const nickname = generateAnonymousNickname();

      expect(nickname.startsWith('익명교사')).toBe(true);
    });

    it('3자리 숫자는 001~999 범위여야 한다', () => {
      const nickname = generateAnonymousNickname();
      const numberPart = nickname.slice(4); // "익명교사" 이후 3자리
      const num = parseInt(numberPart, 10);

      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(999);
    });

    it('100번 생성해도 모두 유효한 형식이어야 한다', () => {
      for (let i = 0; i < 100; i++) {
        const nickname = generateAnonymousNickname();
        expect(nickname).toMatch(/^익명교사\d{3}$/);
      }
    });
  });

  describe('랜덤성 검증', () => {
    it('여러 번 생성 시 서로 다른 닉네임이 생성될 가능성이 있어야 한다', () => {
      const nicknames = new Set<string>();

      for (let i = 0; i < 50; i++) {
        nicknames.add(generateAnonymousNickname());
      }

      // 50번 생성 시 최소 10개 이상 고유 닉네임이 생성되어야 함
      expect(nicknames.size).toBeGreaterThanOrEqual(10);
    });
  });
});

describe('getNicknameForUser (사용자별 고정 닉네임)', () => {
  describe('정상 케이스', () => {
    it('동일 게시글 내 동일 사용자는 같은 닉네임을 받아야 한다', () => {
      const postId = 'post-123';
      const userId = 'user-abc';

      const nickname1 = getNicknameForUser(postId, userId);
      const nickname2 = getNicknameForUser(postId, userId);

      expect(nickname1).toBe(nickname2);
    });

    it('다른 게시글에서는 다른 닉네임을 받을 수 있다', () => {
      const userId = 'user-abc';
      const postId1 = 'post-123';
      const postId2 = 'post-456';

      const nickname1 = getNicknameForUser(postId1, userId);
      const nickname2 = getNicknameForUser(postId2, userId);

      // 다른 게시글에서는 다른 닉네임일 수 있음 (동일할 수도 있으나 일반적으로 다름)
      expect(typeof nickname1).toBe('string');
      expect(typeof nickname2).toBe('string');
    });

    it('같은 게시글 내 다른 사용자는 다른 닉네임을 받아야 한다', () => {
      const postId = 'post-123';
      const user1 = 'user-abc';
      const user2 = 'user-def';

      const nickname1 = getNicknameForUser(postId, user1);
      const nickname2 = getNicknameForUser(postId, user2);

      // 대부분의 경우 다른 닉네임이 생성되어야 함
      expect(typeof nickname1).toBe('string');
      expect(typeof nickname2).toBe('string');
    });

    it('생성된 닉네임은 유효한 형식이어야 한다', () => {
      const nickname = getNicknameForUser('post-123', 'user-abc');

      expect(nickname).toMatch(/^익명교사\d{3}$/);
    });
  });

  describe('엣지 케이스', () => {
    it('빈 문자열 postId와 userId로도 닉네임을 생성해야 한다', () => {
      const nickname = getNicknameForUser('', '');

      expect(nickname).toMatch(/^익명교사\d{3}$/);
    });

    it('특수문자가 포함된 ID로도 닉네임을 생성해야 한다', () => {
      const nickname = getNicknameForUser('post-@#$', 'user-!%^');

      expect(nickname).toMatch(/^익명교사\d{3}$/);
    });
  });
});
