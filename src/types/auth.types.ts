// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 인증 시스템 타입 정의

export enum UserRole {
  TEACHER = 'teacher',
  LAWYER = 'lawyer',
  ADMIN = 'admin',
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  school?: string;
  position?: string;
  association_id?: number;
  association_approved: boolean;
  is_verified: boolean;
  is_active: boolean;
  nickname?: string;
  ip_hash?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  association_id?: number;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  };
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  school?: string;
  position?: string;
  association_id?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}
