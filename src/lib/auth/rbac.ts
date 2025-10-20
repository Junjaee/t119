// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 역할 기반 접근 제어 (RBAC) 유틸리티

import { UserRole } from '@/types/auth.types';

/**
 * 역할 검증 헬퍼 함수
 * @param allowedRoles - 허용된 역할 목록
 * @returns 역할 검증 함수
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (userRole: UserRole): void => {
    if (!allowedRoles.includes(userRole)) {
      throw new Error('Forbidden: Insufficient permissions');
    }
  };
}

/**
 * 역할별 권한 매트릭스
 */
export const ROLE_PERMISSIONS = {
  // 신고 관련 권한
  'reports:create': [UserRole.TEACHER, UserRole.ADMIN],
  'reports:read:own': [UserRole.TEACHER, UserRole.ADMIN],
  'reports:read:all': [UserRole.LAWYER, UserRole.ADMIN],
  'reports:update:own': [UserRole.TEACHER, UserRole.ADMIN],
  'reports:delete:own': [UserRole.TEACHER, UserRole.ADMIN],

  // 법률 상담 관련 권한
  'consultations:create': [UserRole.TEACHER, UserRole.LAWYER, UserRole.ADMIN],
  'consultations:read:own': [UserRole.TEACHER, UserRole.LAWYER, UserRole.ADMIN],
  'consultations:read:all': [UserRole.ADMIN],
  'consultations:update': [UserRole.LAWYER, UserRole.ADMIN],

  // 변호사 배정 권한
  'assignments:create': [UserRole.LAWYER, UserRole.ADMIN],
  'assignments:read': [UserRole.LAWYER, UserRole.ADMIN],
  'assignments:update': [UserRole.LAWYER, UserRole.ADMIN],

  // 사용자 관리 권한
  'users:read': [UserRole.ADMIN],
  'users:update': [UserRole.ADMIN],
  'users:delete': [UserRole.ADMIN],

  // 협회 관리 권한
  'associations:create': [UserRole.ADMIN],
  'associations:read': [UserRole.ADMIN],
  'associations:update': [UserRole.ADMIN],
  'associations:delete': [UserRole.ADMIN],
  'associations:approve': [UserRole.ADMIN],

  // 시스템 설정 권한
  'settings:read': [UserRole.ADMIN],
  'settings:update': [UserRole.ADMIN],

  // 감사 로그 권한
  'audit:read': [UserRole.ADMIN],
} as const;

/**
 * 권한 확인 함수
 * @param userRole - 사용자 역할
 * @param permission - 권한 키
 * @returns 권한 보유 여부
 */
export function hasPermission(
  userRole: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS
): boolean {
  const allowedRoles = ROLE_PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

/**
 * 권한 검증 함수 (에러 발생)
 * @param userRole - 사용자 역할
 * @param permission - 권한 키
 * @throws Forbidden 에러
 */
export function checkPermission(
  userRole: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS
): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }
}
