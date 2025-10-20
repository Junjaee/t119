# 교사119 (Teacher119)

> 교사 권익 보호 통합 지원 플랫폼

## 프로젝트 개요

교사119는 교권 침해 상황에 대한 즉각적인 법률 지원과 상담을 제공하며, 교사 커뮤니티를 통해 경험과 지식을 공유할 수 있는 종합 솔루션입니다.

## 기술 스택

- **프레임워크**: Next.js 14.2 (App Router)
- **언어**: TypeScript 5.6
- **데이터베이스**: Supabase (PostgreSQL 15+)
- **인증**: JWT + Supabase Auth
- **스타일링**: Tailwind CSS 3.4
- **상태 관리**: Zustand + TanStack Query
- **테스트**: Vitest + Testing Library + Playwright
- **패키지 관리**: pnpm

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: teacher119-dev (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: Northeast Asia (ap-northeast-2) - 서울
4. 프로젝트 생성 완료 대기 (약 2분 소요)

### 3. 환경 변수 설정

#### Supabase API 키 확인

1. Supabase Dashboard → **Settings** → **API**
2. 다음 값을 복사:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJ...` (공개 키)
   - **service_role**: `eyJ...` (서비스 역할 키, 보안 유지!)

#### `.env.local` 파일 수정

```.env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here

# Server-Only (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
```

### 4. 데이터베이스 마이그레이션

#### 방법 1: Supabase Dashboard (권장)

1. Supabase Dashboard → **SQL Editor**
2. "New Query" 클릭
3. `supabase/migrations/20251020000000_initial_schema.sql` 내용 복사/붙여넣기
4. "Run" 클릭
5. 동일하게 `supabase/migrations/20251020000001_rls_policies.sql` 실행

#### 방법 2: Supabase CLI (고급)

```bash
# Supabase CLI 설치
npx supabase init

# 로컬 Supabase 시작
npx supabase start

# 마이그레이션 적용
npx supabase db push

# TypeScript 타입 생성
npx supabase gen types typescript --local > src/types/database.types.ts
```

### 5. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 테스트

```bash
# 단위 테스트 실행
pnpm test

# 테스트 커버리지 확인
pnpm test:coverage

# E2E 테스트 (Playwright)
pnpm playwright test
```

## 프로젝트 구조

```
C:\dev\t119
├── .moai/                    # MoAI-ADK 프로젝트 관리
│   ├── config.json          # 프로젝트 설정
│   ├── project/             # 프로젝트 문서
│   │   ├── product.md       # 제품 정의
│   │   ├── structure.md     # 시스템 아키텍처
│   │   └── tech.md          # 기술 스택
│   ├── specs/               # SPEC 문서들
│   │   ├── SPEC-INFRA-001/  # Supabase 통합
│   │   ├── SPEC-AUTH-001/   # 인증 시스템
│   │   └── SPEC-REPORT-001/ # 신고 접수
│   └── memory/              # 개발 가이드
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── supabase/        # Supabase 클라이언트
│   │       ├── client.ts    # 브라우저 클라이언트
│   │       ├── server.ts    # 서버 클라이언트
│   │       └── admin.ts     # Admin SDK
│   └── types/
│       └── database.types.ts # DB 타입 정의
├── supabase/
│   └── migrations/          # 데이터베이스 마이그레이션
│       ├── 20251020000000_initial_schema.sql
│       └── 20251020000001_rls_policies.sql
├── tests/                   # 테스트 파일
└── package.json
```

## 데이터베이스 스키마

### 테이블

1. **users**: 사용자 계정 (교사/변호사/관리자)
2. **associations**: 교원단체 및 변호사 협회
3. **reports**: 교권 침해 신고
4. **consultations**: 변호사-교사 상담
5. **messages**: 실시간 메시지
6. **evidence_files**: 신고 증거 파일 메타데이터

### Row Level Security (RLS)

- **교사**: 본인 신고 및 상담만 접근
- **변호사**: 배정된 상담 및 관련 신고 접근
- **관리자**: 전체 데이터 접근

## 개발 가이드

### SPEC-First TDD 워크플로우

```bash
# 1. SPEC 작성
/alfred:1-spec "기능 제목"

# 2. TDD 구현
/alfred:2-build SPEC-{ID}

# 3. 문서 동기화
/alfred:3-sync
```

### 코드 규칙

- 파일당 ≤300 LOC
- 함수당 ≤50 LOC
- 매개변수 ≤5개
- 테스트 커버리지 ≥85%

### Git 브랜치 전략

- `main`: 프로덕션 준비 코드
- `develop`: 개발 브랜치
- `feature/SPEC-{ID}`: 기능 브랜치

## 배포

### Vercel 배포

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Import Project" → GitHub 저장소 연결
3. 환경 변수 설정 (`.env.example` 참조)
4. 배포 트리거

### 환경별 Supabase 프로젝트

- **Development**: 로컬/개발용
- **Staging**: 스테이징 환경
- **Production**: 프로덕션 환경

## 라이선스

MIT License

## 기여자

- @Alfred (MoAI SuperAgent)
- @teacher119 팀

## 문의

- GitHub Issues: [프로젝트 이슈 페이지]
- 이메일: support@teacher119.com
