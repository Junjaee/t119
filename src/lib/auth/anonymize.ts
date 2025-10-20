// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md | TEST: tests/lib/auth/anonymize.test.ts
// 익명화 로직 (닉네임, IP 해싱, 개인정보 마스킹)

import crypto from 'crypto';
import { UserRole } from '@/types/auth.types';

/**
 * 역할별 자동 닉네임 생성
 * @param role - 사용자 역할 (teacher, lawyer, admin)
 * @returns 익명 닉네임 (예: "익명교사3847")
 */
export function generateNickname(role: UserRole): string {
  const prefix = {
    [UserRole.TEACHER]: '익명교사',
    [UserRole.LAWYER]: '익명변호사',
    [UserRole.ADMIN]: '관리자',
  }[role];

  // 1000~9999 범위의 랜덤 숫자
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}${randomSuffix}`;
}

/**
 * IP 주소 해싱 (SHA-256)
 * @param ipAddress - 원본 IP 주소
 * @returns SHA-256 해시 (64자 hex)
 * @throws IP 주소가 비어있을 경우 에러
 */
export function hashIp(ipAddress: string): string {
  if (!ipAddress || ipAddress.trim() === '') {
    throw new Error('IP address cannot be empty');
  }

  const salt = process.env.IP_SALT || 'default-salt';

  return crypto
    .createHash('sha256')
    .update(ipAddress + salt)
    .digest('hex');
}

/**
 * 이름 마스킹
 * @param name - 원본 이름
 * @returns 마스킹된 이름 (예: "김철수" → "김**")
 */
export function maskName(name: string): string {
  if (!name || name.length <= 2) {
    return name;
  }

  return name[0] + '*'.repeat(name.length - 1);
}

/**
 * 학교명 마스킹
 * @param school - 원본 학교명
 * @returns 마스킹된 학교명 (예: "서울중앙초등학교" → "서울***초등학교")
 */
export function maskSchool(school: string): string {
  if (!school || school.length <= 4) {
    return school;
  }

  // 앞 2자 + 마스킹 + 뒤 4자 (초등학교, 중학교, 고등학교)
  const prefix = school.substring(0, 2);
  const suffix = school.substring(school.length - 4);
  const middleLength = Math.max(1, school.length - 6);

  return prefix + '*'.repeat(middleLength) + suffix;
}
