---
id: TECH-001
version: 0.2.0
status: active
created: 2025-10-01
updated: 2025-10-20
author: @teacher119
priority: high
---

# 교사119 Technology Stack

## HISTORY

### v0.2.0 (2025-10-20)
- **UPDATED**: 교사119 기술 스택 정의
- **AUTHOR**: @Alfred
- **SECTIONS**: Next.js 14, TypeScript, Supabase, 품질 도구 설정
- **REASON**: PRD 기반 기술 스택 확정

### v0.1.1 (2025-10-17)
- **UPDATED**: 템플릿 버전 동기화 (v0.3.8)
- **AUTHOR**: @Alfred

### v0.1.0 (2025-10-01)
- **INITIAL**: 템플릿 생성
- **AUTHOR**: @tech-lead

---

## @DOC:STACK-001: Stack

### 핵심 기술 스택

#### Frontend
```yaml
Runtime: Node.js 20.x LTS
Framework: Next.js 14.2+ (App Router)
Language: TypeScript 5.3+
Styling:
  - Tailwind CSS 3.4+
  - shadcn/ui (Radix UI 기반)
State:
  - Zustand 4.5+ (전역 상태)
  - React Query 5.0+ (서버 상태)
```

#### Backend (BaaS)
```yaml
Platform: Supabase
Database: PostgreSQL 15+
Auth: Supabase Auth + Custom JWT
Storage: Supabase Storage (S3 호환)
Realtime: Supabase Realtime (WebSocket)
Functions: Edge Functions (Deno)
```

#### Development Tools
```yaml
Package Manager: pnpm 8+
Linter: ESLint 8+ (Next.js config)
Formatter: Prettier 3+
Type Check: TypeScript strict mode
Git Hooks: Husky + lint-staged
Testing: Vitest + Testing Library
```

### 기술 선택 근거

#### Next.js 14 (App Router)
- **선택 이유**:
  - React Server Components로 성능 최적화
  - 파일 기반 라우팅으로 개발 속도 향상
  - Vercel 배포 최적화
  - SEO 친화적 (교사 유입 중요)
- **대안 검토**: Remix, SvelteKit → Next.js가 생태계 성숙도 우수

#### TypeScript
- **선택 이유**:
  - 타입 안정성으로 런타임 오류 감소
  - IDE 자동완성으로 개발 생산성 향상
  - 대규모 프로젝트 유지보수 용이
- **설정**: strict mode 활성화

#### Supabase
- **선택 이유**:
  - PostgreSQL 기반 관계형 DB
  - 내장 인증/스토리지/실시간 기능
  - Row Level Security로 보안 강화
  - 무료 티어로 MVP 시작 가능
- **대안 검토**: Firebase → NoSQL이라 복잡한 관계 표현 어려움

---

## @DOC:FRAMEWORK-001: Frameworks

### 프레임워크 및 라이브러리

#### UI 프레임워크
```typescript
// Tailwind CSS 설정
// tailwind.config.ts
export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF7210',
        secondary: '#FFFAF0'
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'sans-serif']
      }
    }
  }
}
```

#### 컴포넌트 라이브러리
- **shadcn/ui**: 커스터마이징 가능한 컴포넌트
- **Radix UI**: 접근성 보장 프리미티브
- **Lucide Icons**: 일관된 아이콘셋

#### 상태 관리
```typescript
// Zustand 스토어 예시
interface AuthStore {
  user: User | null;
  role: UserRole | null;
  setUser: (user: User) => void;
  logout: () => void;
}

// React Query 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    }
  }
})
```

#### 폼 처리
- **React Hook Form**: 성능 최적화된 폼
- **Zod**: 스키마 기반 검증
```typescript
const reportSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  category: z.enum(['parent', 'student', 'colleague']),
  incidentDate: z.date(),
  evidence: z.array(z.instanceof(File)).max(5)
});
```

#### 데이터 시각화
- **Chart.js**: 통계 차트
- **react-chartjs-2**: React 래퍼
- **jsPDF**: PDF 리포트 생성

---

## @DOC:QUALITY-001: Quality

### 품질 정책

#### 코드 품질 도구

##### ESLint 설정
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

##### Prettier 설정
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "always"
}
```

##### Git Hooks (Husky)
```bash
# .husky/pre-commit
#!/bin/sh
pnpm lint-staged
pnpm type-check
pnpm test:unit
```

#### 테스트 전략

##### 테스트 피라미드
- **Unit Tests (70%)**: Vitest
- **Integration Tests (20%)**: Testing Library
- **E2E Tests (10%)**: Playwright

##### 테스트 커버리지 목표
```yaml
Coverage Targets:
  Statements: 85%
  Branches: 80%
  Functions: 85%
  Lines: 85%

Critical Paths (100% required):
  - Authentication flow
  - Report submission
  - Payment processing
```

##### 테스트 예시
```typescript
// vitest.config.ts
export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', '.next']
    }
  }
}
```

#### 성능 최적화

##### Web Vitals 목표
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 600ms

##### 최적화 전략
```typescript
// 이미지 최적화
import Image from 'next/image';

// 동적 임포트
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false
});

// 메모이제이션
const MemoizedComponent = memo(Component);
```

---

## @DOC:SECURITY-001: Security

### 보안 정책

#### 인증 및 인가
```typescript
// JWT 설정
const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: '24h',
  algorithm: 'HS256' as const
};

// 역할 기반 미들웨어
export async function withRole(role: UserRole) {
  return async (req: Request) => {
    const user = await getUser(req);
    if (user.role !== role) {
      throw new UnauthorizedError();
    }
  };
}
```

#### 데이터 보호
- **암호화**: bcrypt (비밀번호), AES-256 (민감 데이터)
- **HTTPS**: 모든 통신 TLS 1.3
- **CORS**: 화이트리스트 도메인만 허용
- **Rate Limiting**: IP당 분당 100 요청

#### 보안 헤더
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

#### 입력 검증
```typescript
// XSS 방지
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'p', 'br']
  });
};

// SQL Injection 방지 (Supabase 자동 처리)
const { data } = await supabase
  .from('reports')
  .select('*')
  .eq('user_id', userId); // 자동 파라미터화
```

---

## @DOC:DEPLOY-001: Deployment

### 배포 전략

#### 환경 구성
```yaml
Development:
  URL: http://localhost:3000
  DB: Supabase (개발 프로젝트)

Staging:
  URL: https://staging.teacher119.com
  DB: Supabase (스테이징 프로젝트)

Production:
  URL: https://teacher119.com
  DB: Supabase (프로덕션 프로젝트)
```

#### Vercel 배포
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "regions": ["icn1"], // 서울 리전
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_KEY": "@supabase_service_key"
  }
}
```

#### CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

#### 모니터링
- **Sentry**: 에러 추적
- **Vercel Analytics**: 성능 모니터링
- **Google Analytics 4**: 사용자 행동
- **Uptime Robot**: 가용성 모니터링

### 개발 환경 설정

#### 필수 도구
```bash
# Node.js 20.x 설치
nvm install 20
nvm use 20

# pnpm 설치
npm install -g pnpm

# 프로젝트 초기화
pnpm create next-app@latest teacher119 \
  --typescript \
  --tailwind \
  --app \
  --src-dir

# 의존성 설치
pnpm add @supabase/supabase-js zustand @tanstack/react-query
pnpm add -D @types/node vitest @testing-library/react
```

#### VS Code 설정
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Next Steps

1. **개발 환경 구성**:
   - Next.js 프로젝트 생성
   - Supabase 프로젝트 설정
   - 개발 도구 설치

2. **기초 설정**:
   - TypeScript 설정 최적화
   - ESLint/Prettier 규칙 확정
   - Git hooks 구성

3. **첫 번째 구현**:
   - `/alfred:1-spec "Supabase 연동 설정"`
   - `/alfred:1-spec "인증 시스템 구현"`