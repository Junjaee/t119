# @SPEC:AUTH-001 구현 계획 (Implementation Plan)

> **SPEC**: `.moai/specs/SPEC-AUTH-001/spec.md`
>
> **목표**: Supabase Auth + Custom JWT 기반 다중 역할 인증 시스템 구축

---

## 1. 우선순위별 마일스톤 (Milestones)

### 1차 목표: 기본 인증 시스템 구축
- [x] Supabase 프로젝트 초기화
- [ ] users 테이블 생성 및 RLS 정책 설정
- [ ] JWT 토큰 발급/검증 로직 구현
- [ ] 회원가입 API 구현 (POST /api/auth/register)
- [ ] 로그인 API 구현 (POST /api/auth/login)
- [ ] 토큰 검증 미들웨어 구현

**완료 기준**: 교사/변호사/관리자 회원가입 및 로그인 성공

---

### 2차 목표: 역할 기반 접근 제어 (RBAC)
- [ ] RBAC 미들웨어 구현 (src/middleware.ts)
- [ ] 역할별 권한 매트릭스 적용
- [ ] API 엔드포인트별 권한 검증
- [ ] 403 Forbidden 에러 처리

**완료 기준**: 교사가 변호사 전용 API 호출 시 403 에러 반환

---

### 3차 목표: 익명화 시스템
- [ ] 자동 닉네임 생성 로직 구현
- [ ] IP 해싱 로직 구현
- [ ] 개인정보 마스킹 유틸리티 함수 작성
- [ ] 회원가입 시 익명화 자동 적용

**완료 기준**: 회원가입 시 "익명교사1234" 형식 닉네임 자동 생성

---

### 4차 목표: 세션 관리 및 토큰 갱신
- [ ] 리프레시 토큰 발급 로직 추가
- [ ] 토큰 갱신 API 구현 (POST /api/auth/refresh)
- [ ] 로그아웃 API 구현 (POST /api/auth/logout)
- [ ] 토큰 블랙리스트 (Redis 또는 DB)
- [ ] 세션 슬라이딩 윈도우 구현

**완료 기준**: 액세스 토큰 만료 시 리프레시 토큰으로 자동 갱신

---

### 5차 목표: 협회 통합 및 승인 정책
- [ ] 회원가입 시 association_id 선택 로직
- [ ] 협회 승인 정책 토글 (자동 승인 / 관리자 승인)
- [ ] 관리자 승인 API 구현
- [ ] 승인 대기 사용자 제한적 접근 처리

**완료 기준**: 교사 회원가입 시 협회 선택 및 승인 상태에 따른 접근 제어

---

### 6차 목표: 보안 강화
- [ ] 비밀번호 복잡도 검증 (Zod 스키마)
- [ ] Rate Limiting 구현 (로그인 5회/5분)
- [ ] 감사 로그 (audit_logs 테이블)
- [ ] 비밀번호 찾기/재설정 API
- [ ] 이메일 인증 기능

**완료 기준**: 로그인 5회 실패 시 15분 차단, 모든 인증 시도 감사 로그 기록

---

## 2. 기술적 접근 방법 (Technical Approach)

### 2.1 Supabase Auth 통합

#### 프로젝트 초기화
```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start
```

#### Supabase 클라이언트 설정
```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Server-side 클라이언트 (Admin SDK)
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

---

### 2.2 JWT 토큰 관리

#### JWT 발급
```typescript
// src/lib/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { UserRole } from '@/types/auth.types';

interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  association_id?: number;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h',
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
}
```

#### JWT 검증
```typescript
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
```

---

### 2.3 비밀번호 해싱

```typescript
// src/lib/auth/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

### 2.4 입력 검증 (Zod)

```typescript
// src/lib/validators/auth.validator.ts
import { z } from 'zod';
import { UserRole } from '@/types/auth.types';

export const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])|(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])|(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      '대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함해야 합니다'
    ),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  role: z.nativeEnum(UserRole),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다').optional(),
  school: z.string().optional(),
  position: z.string().optional(),
  association_id: z.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});
```

---

### 2.5 익명화 로직

```typescript
// src/lib/auth/anonymize.ts
import crypto from 'crypto';
import { UserRole } from '@/types/auth.types';

export function generateNickname(role: UserRole): string {
  const prefix = {
    teacher: '익명교사',
    lawyer: '익명변호사',
    admin: '관리자',
  }[role];

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomSuffix}`;
}

export function hashIp(ipAddress: string): string {
  const salt = process.env.IP_SALT!;
  return crypto
    .createHash('sha256')
    .update(ipAddress + salt)
    .digest('hex');
}

export function maskName(name: string): string {
  if (name.length <= 2) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

export function maskSchool(school: string): string {
  if (school.length <= 4) return school;
  return school.substring(0, 2) + '*'.repeat(school.length - 4) + school.substring(school.length - 2);
}
```

---

### 2.6 Next.js 미들웨어 (RBAC)

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);

    // 사용자 정보를 요청 헤더에 추가
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-User-Id', payload.userId.toString());
    requestHeaders.set('X-User-Role', payload.role);
    requestHeaders.set('X-User-Email', payload.email);

    // 역할 기반 접근 제어
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith('/api/admin') && payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (pathname.startsWith('/api/reports') && payload.role === 'lawyer') {
      // 변호사는 자신이 배정받은 신고만 조회 가능
      // 추가 검증 로직 필요
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    '/api/reports/:path*',
    '/api/consultations/:path*',
    '/api/admin/:path*',
  ],
};
```

---

## 3. 아키텍처 설계 방향 (Architecture)

### 3.1 디렉토리 구조
```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/
│   │       │   └── route.ts
│   │       ├── login/
│   │       │   └── route.ts
│   │       ├── logout/
│   │       │   └── route.ts
│   │       ├── refresh/
│   │       │   └── route.ts
│   │       ├── me/
│   │       │   └── route.ts
│   │       ├── forgot/
│   │       │   └── route.ts
│   │       └── reset/
│   │           └── route.ts
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot/
│   │       └── page.tsx
│   └── middleware.ts
│
├── lib/
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── anonymize.ts
│   │   └── rbac.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   └── validators/
│       └── auth.validator.ts
│
├── types/
│   └── auth.types.ts
│
└── hooks/
    └── useAuth.ts
```

### 3.2 상태 관리 (Zustand)
```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setUser: (user) => set({ user }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  logout: () => set({ user: null, accessToken: null, refreshToken: null }),
}));
```

---

## 4. 리스크 및 대응 방안 (Risks & Mitigations)

### 리스크 1: JWT Secret 노출
- **가능성**: 높음 (환경 변수 관리 실수)
- **영향**: 치명적 (모든 토큰 무효화, 재발급 필요)
- **대응**:
  - `.env.local`을 `.gitignore`에 추가
  - Vercel 환경 변수로 관리
  - 정기적으로 Secret 로테이션 (90일)

### 리스크 2: 세션 고정 공격 (Session Fixation)
- **가능성**: 중간 (로그인 후 세션 ID 변경 누락)
- **영향**: 높음 (계정 탈취 가능)
- **대응**:
  - 로그인 시 새로운 JWT 발급
  - 기존 토큰 블랙리스트 추가

### 리스크 3: Rate Limiting 우회
- **가능성**: 중간 (분산 공격, IP 변경)
- **영향**: 중간 (무차별 대입 공격 가능)
- **대응**:
  - Redis 기반 분산 Rate Limiting
  - 이메일 기반 추가 제한
  - CAPTCHA 추가 (5회 실패 시)

### 리스크 4: Supabase 장애
- **가능성**: 낮음 (클라우드 서비스 안정성)
- **영향**: 치명적 (전체 서비스 중단)
- **대응**:
  - Fallback DB 준비 (PostgreSQL 직접 연결)
  - 헬스 체크 엔드포인트 구현
  - 장애 알림 시스템 (Sentry)

---

## 5. 테스트 전략 (Testing Strategy)

### 5.1 TDD 사이클

#### RED: 실패하는 테스트 작성
```typescript
// tests/auth/jwt.test.ts
import { describe, it, expect } from 'vitest';
import { generateAccessToken, verifyAccessToken } from '@/lib/auth/jwt';

describe('JWT 토큰 발급 및 검증', () => {
  it('유효한 토큰을 발급해야 한다', () => {
    const payload = {
      userId: 123,
      email: 'test@example.com',
      role: 'teacher' as const,
    };

    const token = generateAccessToken(payload);
    expect(token).toBeDefined();
  });

  it('발급된 토큰을 검증해야 한다', () => {
    const payload = {
      userId: 123,
      email: 'test@example.com',
      role: 'teacher' as const,
    };

    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(123);
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('teacher');
  });

  it('잘못된 토큰은 거부해야 한다', () => {
    expect(() => {
      verifyAccessToken('invalid_token');
    }).toThrow('Invalid token');
  });
});
```

#### GREEN: 최소한의 구현
```typescript
// src/lib/auth/jwt.ts (초기 구현)
import jwt from 'jsonwebtoken';

export function generateAccessToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

#### REFACTOR: 코드 개선
- 타입 안정성 추가 (JwtPayload 인터페이스)
- 에러 처리 세분화 (TokenExpiredError, JsonWebTokenError)
- 환경 변수 검증 (JWT_SECRET 존재 여부)

### 5.2 API 통합 테스트
```typescript
// tests/api/auth/register.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/auth/register/route';

describe('POST /api/auth/register', () => {
  it('유효한 데이터로 회원가입 성공', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'teacher@example.com',
        password: 'SecurePass123!',
        name: '김철수',
        role: 'teacher',
      },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('teacher@example.com');
  });

  it('중복 이메일로 회원가입 실패', async () => {
    // 첫 번째 회원가입
    await POST(createMocks({
      method: 'POST',
      body: {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: '김철수',
        role: 'teacher',
      },
    }).req);

    // 두 번째 회원가입 (중복)
    const response = await POST(createMocks({
      method: 'POST',
      body: {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: '이영희',
        role: 'teacher',
      },
    }).req);

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('EMAIL_DUPLICATE');
  });
});
```

---

## 6. 배포 및 모니터링 (Deployment & Monitoring)

### 6.1 환경 변수
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
JWT_SECRET=xxx (256bit random)
JWT_REFRESH_SECRET=xxx (256bit random)
IP_SALT=xxx (random string)
```

### 6.2 CI/CD 파이프라인
```yaml
# .github/workflows/auth.yml
name: Auth System Tests
on:
  push:
    branches: [main, develop]
    paths:
      - 'src/app/api/auth/**'
      - 'src/lib/auth/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm test:auth
      - run: pnpm build
```

### 6.3 모니터링
- **Sentry**: 인증 에러 추적 (Invalid token, Unauthorized)
- **Vercel Analytics**: 로그인/회원가입 성공률
- **감사 로그**: 일일 인증 시도 횟수, IP별 실패율

---

**작성일**: 2025-10-20
**다음 업데이트**: TDD 구현 시작 시
