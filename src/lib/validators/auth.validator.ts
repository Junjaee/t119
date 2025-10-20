// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 인증 API 입력 검증 스키마

import { z } from 'zod';
import { UserRole } from '@/types/auth.types';

/**
 * 회원가입 입력 검증 스키마
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일을 입력하세요'),

  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])|(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])|(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      '대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함해야 합니다'
    ),

  name: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 입력 가능합니다'),

  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: '유효한 역할을 선택하세요' }),
  }),

  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)')
    .optional(),

  school: z
    .string()
    .min(2, '학교명은 최소 2자 이상이어야 합니다')
    .max(100, '학교명은 최대 100자까지 입력 가능합니다')
    .optional(),

  position: z
    .string()
    .max(50, '직위는 최대 50자까지 입력 가능합니다')
    .optional(),

  association_id: z
    .number()
    .int('협회 ID는 정수여야 합니다')
    .positive('협회 ID는 양수여야 합니다')
    .optional(),
});

/**
 * 로그인 입력 검증 스키마
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일을 입력하세요'),

  password: z
    .string()
    .min(1, '비밀번호를 입력하세요'),
});

/**
 * 토큰 갱신 입력 검증 스키마
 */
export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, '리프레시 토큰을 입력하세요'),
});

/**
 * 비밀번호 찾기 입력 검증 스키마
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('유효한 이메일을 입력하세요'),
});

/**
 * 비밀번호 재설정 입력 검증 스키마
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, '재설정 토큰을 입력하세요'),

  newPassword: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])|(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])|(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      '대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함해야 합니다'
    ),
});

// 타입 추론
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
