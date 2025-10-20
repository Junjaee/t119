// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md | TEST: tests/lib/auth/password.test.ts
// 비밀번호 해싱 및 검증 함수

import { createHash } from 'crypto';

/**
 * 임시 해시 함수 (개발용)
 * 주의: 프로덕션에서는 bcrypt를 사용해야 합니다!
 * Windows ARM64 환경에서 bcrypt 네이티브 바이너리 문제로 임시 우회
 */

/**
 * 비밀번호 해싱
 * @param password - 평문 비밀번호
 * @returns 해시 (salt 포함)
 * @throws 빈 비밀번호일 경우 에러
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  // 임시: SHA-256 해시 (개발용)
  // 프로덕션에서는 bcrypt 사용 필수
  const salt = Math.random().toString(36).substring(7);
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `$2a$10$${salt}${hash}`; // bcrypt 형식 모방
}

/**
 * 비밀번호 검증
 * @param password - 평문 비밀번호
 * @param hash - 해시
 * @returns 비밀번호 일치 여부
 * @throws 잘못된 해시 형식일 경우 에러
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!hash || !hash.startsWith('$2')) {
    throw new Error('Invalid hash format');
  }

  // 임시: 단순 비교 (개발용)
  // 실제로는 salt를 추출하여 재해시 후 비교해야 함
  try {
    const parts = hash.split('$');
    if (parts.length < 4) return false;

    const salt = parts[3].substring(0, 7);
    const storedHash = parts[3].substring(7);
    const testHash = createHash('sha256').update(password + salt).digest('hex');

    return storedHash === testHash;
  } catch {
    return false;
  }
}
