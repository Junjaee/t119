// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md
// 회원가입 API 엔드포인트

import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validators/auth.validator';
import { hashPassword } from '@/lib/auth/password';
import { generateNickname, hashIp } from '@/lib/auth/anonymize';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ZodError } from 'zod';

/**
 * POST /api/auth/register
 * 회원가입
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 요청 본문 파싱
    const body = await req.json();

    // 2. 입력 검증
    const validatedData = registerSchema.parse(body);

    // 3. 이메일 중복 확인
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_DUPLICATE',
            message: '이미 등록된 이메일입니다.',
          },
        },
        { status: 400 }
      );
    }

    // 4. 비밀번호 해싱
    const passwordHash = await hashPassword(validatedData.password);

    // 5. 익명화 처리
    const nickname = generateNickname(validatedData.role);
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = hashIp(ipAddress);

    // 6. 협회 승인 정책 결정 (교사만 해당)
    let associationApproved = true; // 기본: 자동 승인
    if (validatedData.role === 'teacher' && validatedData.association_id) {
      // 협회별 승인 정책 조회 (추후 구현)
      // 현재는 자동 승인으로 설정
      associationApproved = true;
    }

    // 7. Supabase Auth 회원가입
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: false, // 이메일 인증 필요
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: '회원가입에 실패했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 8. users 테이블에 삽입
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        email: validatedData.email,
        password_hash: passwordHash,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        school: validatedData.school,
        position: validatedData.position,
        association_id: validatedData.association_id,
        association_approved: associationApproved,
        is_verified: false,
        is_active: true,
        nickname,
        ip_hash: ipHash,
      })
      .select()
      .single();

    if (dbError || !userData) {
      // Supabase Auth 사용자 삭제 (롤백)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: '사용자 정보 저장에 실패했습니다.',
          },
        },
        { status: 500 }
      );
    }

    // 9. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            nickname: userData.nickname,
            association_approved: userData.association_approved,
          },
        },
        message: '회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Zod 검증 에러
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || '입력 값이 올바르지 않습니다.',
          },
        },
        { status: 400 }
      );
    }

    // 기타 서버 에러
    console.error('Register error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
