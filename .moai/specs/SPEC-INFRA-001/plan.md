# INFRA-001 구현 계획

> **SPEC**: `SPEC-INFRA-001.md` - Supabase 통합 설정
>
> **우선순위**: Critical
>
> **목표**: 교사119 플랫폼의 핵심 백엔드 인프라 구축 완료

---

## 개요

Supabase를 교사119 플랫폼의 핵심 백엔드 인프라로 통합합니다. 데이터베이스 스키마 설계, RLS 정책 구성, 타입 안전한 클라이언트 래퍼 구현을 포함합니다.

---

## 우선순위별 마일스톤

### 1차 목표: Supabase 프로젝트 생성 및 환경 설정

**완료 기준**:
- Supabase 프로젝트 3개 생성 (개발/스테이징/프로덕션)
- 환경 변수 설정 완료 (`.env.local`, `.env.production`)
- Supabase CLI 설치 및 로컬 개발 환경 구성

**주요 작업**:
1. Supabase 계정 생성 및 프로젝트 생성
   - 개발 프로젝트: `teacher119-dev`
   - 스테이징 프로젝트: `teacher119-staging`
   - 프로덕션 프로젝트: `teacher119-prod`

2. 환경 변수 파일 생성
   - `.env.local` (개발용)
   - `.env.example` (템플릿, Git 커밋)
   - `.gitignore`에 `.env.local` 추가

3. Supabase CLI 설치
   ```bash
   npm install -g supabase
   npx supabase init
   npx supabase login
   npx supabase link --project-ref your-project-id
   ```

**검증 방법**:
- Supabase 대시보드에 접속 확인
- `npx supabase status` 명령어로 로컬 DB 상태 확인
- 환경 변수 로딩 확인 (`console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`)

---

### 2차 목표: 데이터베이스 스키마 설계 및 마이그레이션

**완료 기준**:
- 6개 핵심 테이블 생성 (users, associations, reports, consultations, messages, evidence_files)
- 초기 마이그레이션 파일 생성 및 적용
- 타임스탬프 자동 업데이트 트리거 설정

**주요 작업**:
1. 초기 마이그레이션 생성
   ```bash
   npx supabase migration new initial_schema
   ```

2. SQL 스키마 작성 (`supabase/migrations/xxxxxx_initial_schema.sql`)
   - `users` 테이블: 사용자 정보 (id, email, role, association_id, ...)
   - `associations` 테이블: 교원단체/협회 (id, name, code, type, ...)
   - `reports` 테이블: 교권 침해 신고 (id, user_id, title, description, ...)
   - `consultations` 테이블: 법률 상담 (id, report_id, lawyer_id, status, ...)
   - `messages` 테이블: 상담 메시지 (id, consultation_id, sender_id, content, ...)
   - `evidence_files` 테이블: 증거 파일 (id, report_id, file_path, ...)

3. 인덱스 생성
   - 자주 검색되는 컬럼에 인덱스 추가
   - 외래 키 관계에 인덱스 추가
   - 성능 최적화를 위한 복합 인덱스

4. 타임스탬프 자동 업데이트 트리거
   ```sql
   CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER update_users_updated_at
   BEFORE UPDATE ON users
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column();
   ```

5. 마이그레이션 적용
   ```bash
   npx supabase db push
   ```

**검증 방법**:
- Supabase 대시보드에서 테이블 생성 확인
- `\dt` 명령어로 테이블 목록 확인
- 샘플 데이터 INSERT 후 타임스탬프 자동 업데이트 확인

---

### 3차 목표: Row Level Security (RLS) 정책 구성

**완료 기준**:
- 모든 테이블에 RLS 활성화
- 역할별 접근 정책 정의 (teacher, lawyer, admin)
- RLS 정책 테스트 완료

**주요 작업**:
1. RLS 활성화
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
   ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
   ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
   ```

2. `users` 테이블 정책
   - 자신의 정보 조회 (모든 역할)
   - 자신의 정보 수정 (모든 역할)
   - 모든 사용자 조회 (관리자만)
   - 사용자 생성/수정/삭제 (관리자만)

3. `reports` 테이블 정책
   - 자신의 신고 조회 (교사)
   - 자신의 신고 생성 (교사)
   - 배정된 신고 조회 (변호사)
   - 모든 신고 조회 (관리자)

4. `consultations` 테이블 정책
   - 자신의 신고 관련 상담 조회 (교사)
   - 배정된 상담 조회/수정 (변호사)
   - 모든 상담 조회 (관리자)

5. `messages` 테이블 정책
   - 상담 참여자만 메시지 조회/생성

6. `evidence_files` 테이블 정책
   - 신고 작성자와 배정된 변호사만 조회

**검증 방법**:
- 각 역할별 계정으로 테스트 쿼리 실행
- 권한 없는 데이터 접근 시 에러 발생 확인
- RLS 정책 우회 시도 (SQL Injection 등) 차단 확인

---

### 4차 목표: Supabase 클라이언트 래퍼 구현

**완료 기준**:
- 3개 클라이언트 파일 생성 (client.ts, server.ts, admin.ts)
- TypeScript 타입 안전성 보장
- 환경별 설정 자동 적용

**주요 작업**:
1. 의존성 설치
   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr
   ```

2. 브라우저 클라이언트 (`src/lib/supabase/client.ts`)
   - `createBrowserClient` 사용
   - Anon Key로 초기화
   - 클라이언트 사이드 렌더링에 사용

3. 서버 클라이언트 (`src/lib/supabase/server.ts`)
   - `createServerClient` 사용
   - 쿠키 핸들러 통합
   - Server Components/API Routes에 사용

4. Admin 클라이언트 (`src/lib/supabase/admin.ts`)
   - `createClient` + Service Role Key 사용
   - RLS 우회 가능 (관리자 작업용)
   - 서버 사이드 전용

5. TypeScript 타입 생성
   ```bash
   npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
   ```

6. 타입 재사용
   ```typescript
   import type { Database } from '@/types/database.types';

   type User = Database['public']['Tables']['users']['Row'];
   type Report = Database['public']['Tables']['reports']['Row'];
   ```

**검증 방법**:
- 브라우저에서 `createClient()` 호출 후 쿼리 실행
- 서버 컴포넌트에서 `createClient()` 호출 후 쿼리 실행
- Admin 클라이언트로 RLS 우회 쿼리 실행
- TypeScript 컴파일 에러 없음 확인

---

### 5차 목표: 스토리지 버킷 설정

**완료 기준**:
- 3개 버킷 생성 (evidence, documents, avatars)
- 버킷별 접근 정책 설정
- 파일 업로드/다운로드 테스트 완료

**주요 작업**:
1. 버킷 생성
   - `evidence`: 신고 증거 자료 (비공개)
   - `documents`: 법률 문서 (비공개)
   - `avatars`: 프로필 이미지 (공개)

2. 버킷 정책 설정
   ```sql
   -- evidence 버킷: 신고 작성자와 배정된 변호사만 접근
   CREATE POLICY "Evidence access for report participants"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'evidence' AND
     auth.uid() IN (
       SELECT user_id FROM reports WHERE id::text = (storage.foldername(name))[1]
       UNION
       SELECT lawyer_id FROM consultations WHERE report_id::text = (storage.foldername(name))[1]
     )
   );

   -- avatars 버킷: 모든 인증 사용자 읽기 가능, 자신만 쓰기 가능
   CREATE POLICY "Avatars are publicly readable"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');

   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

3. 파일 업로드 유틸리티 함수
   ```typescript
   export async function uploadEvidence(
     reportId: string,
     file: File
   ): Promise<string> {
     const supabase = createClient();
     const fileName = `${reportId}/${Date.now()}_${file.name}`;

     const { data, error } = await supabase.storage
       .from('evidence')
       .upload(fileName, file, {
         cacheControl: '3600',
         upsert: false,
       });

     if (error) throw error;
     return data.path;
   }
   ```

**검증 방법**:
- 각 버킷에 샘플 파일 업로드
- 접근 권한 없는 사용자로 다운로드 시도 (차단 확인)
- 파일 삭제 후 404 에러 확인

---

## 기술적 접근 방법

### TDD 전략

**RED 단계**: 테스트 작성
```typescript
// @TEST:INFRA-001 | SPEC: SPEC-INFRA-001.md
import { describe, it, expect } from 'vitest';
import { createClient } from '@/lib/supabase/client';

describe('Supabase Client', () => {
  it('should create browser client successfully', () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should fail to query without authentication', async () => {
    const client = createClient();
    const { error } = await client.from('users').select('*');
    expect(error).toBeDefined();
  });
});

describe('RLS Policies', () => {
  it('should allow teachers to view own reports', async () => {
    // 테스트 사용자 로그인 후 자신의 신고 조회
    const client = createClient();
    await client.auth.signInWithPassword({
      email: 'teacher@test.com',
      password: 'password',
    });

    const { data, error } = await client.from('reports').select('*');
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should prevent teachers from viewing other reports', async () => {
    const client = createClient();
    await client.auth.signInWithPassword({
      email: 'teacher@test.com',
      password: 'password',
    });

    const { data, error } = await client
      .from('reports')
      .select('*')
      .eq('user_id', 'other-user-id');

    expect(data).toHaveLength(0);
  });
});
```

**GREEN 단계**: 구현
- Supabase 프로젝트 생성 및 환경 설정
- 스키마 마이그레이션 적용
- RLS 정책 생성
- 클라이언트 래퍼 구현

**REFACTOR 단계**: 코드 품질 개선
- 타입 안전성 강화
- 에러 핸들링 추가
- 성능 최적화 (인덱싱, 쿼리 최적화)

---

## 리스크 및 대응 방안

### 리스크 1: RLS 정책 설정 오류
- **문제**: 잘못된 RLS 정책으로 데이터 유출 가능
- **대응**:
  - 각 정책마다 테스트 케이스 작성
  - Supabase 대시보드에서 정책 시뮬레이션
  - 프로덕션 배포 전 보안 감사

### 리스크 2: 환경 변수 노출
- **문제**: Service Role Key 노출 시 보안 위협
- **대응**:
  - `.env.local`을 `.gitignore`에 추가
  - GitHub Secrets로 CI/CD 환경 변수 관리
  - Vercel 환경 변수로 프로덕션 키 관리

### 리스크 3: 마이그레이션 실패
- **문제**: 프로덕션 DB 손상 가능
- **대응**:
  - 마이그레이션 전 백업 생성
  - 스테이징 환경에서 먼저 테스트
  - 롤백 스크립트 준비

### 리스크 4: 타입 불일치
- **문제**: DB 스키마와 TypeScript 타입 불일치
- **대응**:
  - 스키마 변경 시마다 타입 재생성
  - CI/CD에 타입 체크 단계 추가
  - `strict` 모드로 컴파일

---

## 아키텍처 설계 방향

### 디렉토리 구조
```
src/
├── lib/
│   └── supabase/
│       ├── client.ts       # 브라우저 클라이언트
│       ├── server.ts       # 서버 클라이언트
│       └── admin.ts        # Admin 클라이언트
├── types/
│   └── database.types.ts   # DB 스키마 타입
└── utils/
    └── storage.ts          # 파일 업로드 유틸리티

supabase/
├── migrations/
│   └── 20251020000000_initial_schema.sql
└── config.toml             # Supabase 설정
```

### 클라이언트 선택 가이드
- **브라우저 (Client Components)**: `client.ts` 사용
- **서버 (Server Components, API Routes)**: `server.ts` 사용
- **관리자 작업 (RLS 우회 필요)**: `admin.ts` 사용

---

## 의존성

### 선행 작업
- Next.js 14 프로젝트 초기화
- TypeScript 설정 완료
- 환경 변수 파일 구조 결정

### 후속 작업
- `AUTH-001`: 인증 시스템 구현 (Supabase Auth 활용)
- `REPORT-001`: 신고 시스템 구현 (reports 테이블 사용)

---

## 참조 문서

- **SPEC**: `SPEC-INFRA-001.md` - 상세 요구사항
- **Acceptance**: `acceptance.md` - 수락 기준
- **Supabase 공식 문서**: https://supabase.com/docs
- **Next.js + Supabase 가이드**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
