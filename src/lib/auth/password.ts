// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md | TEST: tests/lib/auth/password.test.ts
// 비밀번호 해싱 및 검증 함수

import bcrypt from 'bcrypt';

/**
 * bcrypt salt rounds
 * 보안 요구사항: 10 이상
 */
const SALT_ROUNDS = 10;

/**
 * 비밀번호 해싱
 * @param password - 평문 비밀번호
 * @returns bcrypt 해시 (salt 포함)
 * @throws 빈 비밀번호일 경우 에러
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호 검증
 * @param password - 평문 비밀번호
 * @param hash - bcrypt 해시
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

  return bcrypt.compare(password, hash);
}
