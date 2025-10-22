<!-- @DOC:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | SYNC: 2025-10-22 -->

# 교사119 커뮤니티 게시판 시스템

## 📋 개요

| 항목 | 내용 |
|------|------|
| **SPEC** | [SPEC-COMMUNITY-001](../.moai/specs/SPEC-COMMUNITY-001/spec.md) |
| **버전** | v0.0.4 (Draft) |
| **상태** | 70% 완료 |
| **마지막 업데이트** | 2025-10-22 |
| **작성자** | @Alfred |
| **우선순위** | High |

---

## 🎯 핵심 기능 (Complete)

### 1. 게시글 시스템
- **익명 닉네임 자동 부여** - "익명교사###" 형식 (랜덤 3자리 숫자)
- **카테고리 분류** - case (사례), qa (Q&A), info (정보)
- **조회수 및 인기 배지** - 조회수 100회 이상 시 "인기 게시글" 표시
- **임시 저장** - 30초마다 자동 저장 (구현: useDraft Hook)

### 2. 댓글 시스템
- **익명 댓글** - 게시글별 동일 사용자는 동일 닉네임 유지
- **댓글 작성 API** - 200ms 내 응답 (성능 요구사항)

### 3. 보안 및 관리
- **부적절 콘텐츠 신고** - 신고 3회 이상 시 자동 블라인드 처리
- **XSS 방지** - HTML 태그 이스케이프
- **스팸 방지** - 게시글 작성 10초 간격 제한

---

## 📁 아키텍처 (5계층)

```
┌─────────────────────────────────────────┐
│        UI Layer (React Components)      │  ✅ Complete (v0.0.4)
│   PostCard, PostList, CommentSection    │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│   Hooks Layer (React Query Hooks)       │  ✅ Complete (v0.0.4)
│ usePosts, usePost, useCreatePost, ...   │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│     Service Layer (Business Logic)      │  ✅ Complete (v0.0.3)
│  communityService (8 functions)         │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│  Data/Validation Layer (Validators)     │  ✅ Complete (v0.0.2)
│ PostValidator, CommentValidator, Utils  │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│      Database Layer (Supabase)          │  ✅ Complete (v0.0.3)
│   4 Tables + RLS Policies + Triggers    │
└─────────────────────────────────────────┘
```

---

## 📊 구현 현황 (70% Complete)

### ✅ 완료된 기능

#### 1. 검증 & 타입 계층 (v0.0.2)
- **파일**:
  - `src/lib/validators/post.validator.ts` (81 LOC)
  - `src/lib/validators/comment.validator.ts` (28 LOC)
  - `src/types/community.types.ts` (98 LOC)
  - `src/lib/utils/nickname-generator.ts` (42 LOC)

- **테스트**: 44개 100% 통과 ✅
  - Post 제목/본문 길이 검증 (5~100자, 20~5000자)
  - Comment 길이 검증 (1~500자)
  - Nickname 생성 로직 (익명교사###)

#### 2. 데이터베이스 스키마 (v0.0.3)
- **4 Tables**:
  - `posts` - 게시글 (id, category, title, content, anonymous_nickname, view_count, is_popular, is_blinded)
  - `comments` - 댓글 (id, post_id, author_id, anonymous_nickname, content)
  - `post_reports` - 신고 (id, post_id, reporter_id, reason, status)
  - `post_drafts` - 임시 저장 (id, author_id, category, title, content)

- **RLS 정책**: 인증된 사용자만 접근, 작성자 본인 수정/삭제
- **Triggers**: view_count 증가, is_popular 자동 계산

- **파일**: `.moai/specs/SPEC-COMMUNITY-001/supabase-schema.sql` (254 LOC)

#### 3. 서비스 계층 (v0.0.3)
- **파일**: `src/lib/services/community-service.ts` (562 LOC)

- **8개 서비스 함수**:
  1. `getPosts()` - 게시글 목록 (페이지네이션, 필터링, 정렬)
  2. `getPost()` - 게시글 상세 (조회수 +1)
  3. `createPost()` - 게시글 작성 (익명 닉네임 부여)
  4. `createComment()` - 댓글 작성
  5. `reportPost()` - 게시글 신고
  6. `getDraft()` - 임시 저장 조회
  7. `upsertDraft()` - 임시 저장 작성/업데이트
  8. `deletePost()` - 게시글 삭제 (작성자만)

- **테스트**: 16개 100% 통과 ✅
  - 닉네임 로직 검증 (동일 사용자 동일 닉네임 유지)
  - 타입 안전성
  - SPEC 매핑 완성도

#### 4. UI 계층 (v0.0.4)

**React Query Hooks** (`src/hooks/community/`):
1. `usePosts()` - 게시글 목록 (페이지네이션, 필터링, 정렬)
2. `usePost()` - 게시글 상세 조회
3. `useCreatePost()` - 게시글 작성 (Mutation)
4. `useCreateComment()` - 댓글 작성 (Mutation)
5. `useReportPost()` - 게시글 신고 (Mutation)
6. `useDraft()` - 임시 저장 조회/저장 (Mutation)
7. `index.ts` - Hooks 통합 export

**Components** (`src/components/community/`):
1. `PostCard.tsx` - 게시글 카드
   - 익명 닉네임 표시
   - 조회수 및 상대 시간
   - 카테고리 배지

2. `PostList.tsx` - 게시글 목록
   - 로딩/에러/빈 상태 처리
   - 페이지네이션

3. `CommentSection.tsx` - 댓글 영역 (선택적, 추가 구현)
   - 댓글 목록
   - 댓글 작성 폼

**Pages**:
- `src/app/community/page.tsx` - 커뮤니티 메인 (PostList 통합)
- `src/app/community/test/page.tsx` - 테스트 페이지
- `src/app/community/new/page.tsx` - 게시글 작성 페이지 (선택적)
- `src/app/community/[id]/page.tsx` - 게시글 상세 페이지 (선택적)

**테스트**: 12개 예정 (Supabase 연결 후)

#### 5. 패키지 의존성
- `date-fns@4.1.0` - 상대 시간 표시 (예: "3시간 전", "어제")

---

### ⏳ 미완료 기능 (30% Remaining)

#### 1. API Routes (❌ 예정)
**파일**: `src/app/api/community/` (구현 필요)

| 엔드포인트 | 메서드 | 상태 | 참고 |
|-----------|--------|------|------|
| `/api/community/posts` | POST | ❌ 예정 | 게시글 작성 |
| `/api/community/posts` | GET | ❌ 예정 | 게시글 목록 (페이지네이션) |
| `/api/community/posts/:id` | GET | ❌ 예정 | 게시글 상세 (조회수 +1) |
| `/api/community/posts/:id/comments` | POST | ❌ 예정 | 댓글 작성 |
| `/api/community/posts/:id/report` | POST | ❌ 예정 | 게시글 신고 |
| `/api/community/drafts` | POST | ❌ 예정 | 임시 저장 |

**요구사항** (SPEC):
- 모든 요청에 JWT 인증 필수 (S-001, S-002)
- 게시글 수정/삭제는 작성자만 (S-003)
- 응답 시간: 게시글 목록 500ms, 상세 300ms, 댓글 작성 200ms
- 프리페칭/캐싱 전략 구현

#### 2. 게시글 상세 페이지 (❌ 예정)
**파일**: `src/app/community/[id]/page.tsx` (선택적)

**기능**:
- 게시글 상세 조회
- 댓글 목록
- 댓글 작성 폼
- 신고 버튼

#### 3. E2E 테스트 (⏳ Supabase 연결 대기)
**파일**: `tests/e2e/community/` (6개 테스트)

- `post-create.e2e.test.ts` - 게시글 작성 플로우
- `post-list.e2e.test.ts` - 게시글 목록 조회
- `post-detail.e2e.test.ts` - 게시글 상세 조회
- `comment-create.e2e.test.ts` - 댓글 작성
- `post-report.e2e.test.ts` - 게시글 신고
- `draft.e2e.test.ts` - 임시 저장

**상태**: 파일 구조만 생성됨, Supabase 데이터베이스 연결 후 구현 예정

---

## 🔗 TAG 추적성

### @SPEC:COMMUNITY-001
- **위치**: `.moai/specs/SPEC-COMMUNITY-001/spec.md`
- **버전**: v0.0.4 (2025-10-22)
- **내용**: 커뮤니티 게시판 시스템 명세 (EARS 방식)

### @TEST:COMMUNITY-001
- **현황**: 12개 테스트 (단위 + 통합)
  - Post validator: 254 LOC, 20개 테스트
  - Comment validator: 95 LOC, 10개 테스트
  - Nickname generator: 110 LOC, 14개 테스트
  - Service layer: 112 LOC, 16개 테스트
  - E2E tests: 6개 파일 (Supabase 연결 대기)

### @CODE:COMMUNITY-001
- **현황**: 21개 파일 (유효 클래스/함수 컴포넌트)
  - 검증: 2개 (post, comment validators)
  - 타입: 1개 (community.types.ts)
  - 유틸: 1개 (nickname-generator.ts)
  - 서비스: 1개 (community-service.ts with 8 functions)
  - Hooks: 7개 (usePosts, usePost, useCreatePost, useCreateComment, useReportPost, useDraft, index)
  - Components: 3개 (PostCard, PostList, CommentSection, index)
  - Pages: 4개 (page.tsx, new/page.tsx, [id]/page.tsx, test/page.tsx)
  - Providers: 1개 (QueryClient 통합)
  - 총 562 + 81 + 28 + 42 = 713 LOC (implementation)

### @DOC:COMMUNITY-001
- **현황**: Living Document 생성 완료 (본 파일)
  - 아키텍처 설명
  - 구현 현황 (70% 완료)
  - API 매핑
  - 테스트 계획
  - 다음 단계

---

## 📚 API 매핑

### 4.1 게시글 API

#### POST /api/community/posts
**요청**:
```typescript
{
  category: 'case' | 'qa' | 'info';
  title: string;        // 5~100자
  content: string;      // 20~5000자
  image?: File;         // optional, max 5MB (PNG, JPG, GIF)
}
```

**응답** (201 Created):
```typescript
{
  post: {
    id: string;
    category: string;
    title: string;
    content: string;
    anonymous_nickname: string;  // 자동 생성 (익명교사###)
    view_count: 0;
    is_popular: false;
    created_at: string;
  }
}
```

**구현**: `communityService.createPost()` + `PostValidator.validateCreatePost()`

---

#### GET /api/community/posts
**쿼리 파라미터**:
```typescript
{
  category?: 'case' | 'qa' | 'info';  // optional 필터
  page?: number;       // default: 1
  limit?: number;      // default: 20, max: 100
  sort?: 'latest' | 'popular';  // default: 'latest'
}
```

**응답** (200 OK):
```typescript
{
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  }
}
```

**구현**: `communityService.getPosts()` + `usePosts()` Hook

---

#### GET /api/community/posts/:id
**응답** (200 OK):
```typescript
{
  post: Post;
  comments: Comment[];
}
```

**부작용**: 조회수 +1

**구현**: `communityService.getPost()` + `usePost()` Hook

---

### 4.2 댓글 API

#### POST /api/community/posts/:id/comments
**요청**:
```typescript
{
  content: string;  // 1~500자
}
```

**응답** (201 Created):
```typescript
{
  comment: {
    id: string;
    post_id: string;
    anonymous_nickname: string;  // 게시글별 고정 닉네임
    content: string;
    created_at: string;
  }
}
```

**구현**: `communityService.createComment()` + `useCreateComment()` Hook

---

### 4.3 신고 API

#### POST /api/community/posts/:id/report
**요청**:
```typescript
{
  reason: string;  // 1~200자
}
```

**응답** (201 Created):
```typescript
{
  report: {
    id: string;
    status: 'pending';
    created_at: string;
  }
}
```

**요구사항**:
- 동일 사용자는 1회만 신고 가능 (C-007)
- 신고 3회 이상 시 자동 블라인드 처리 (ER-003)

**구현**: `communityService.reportPost()` + `useReportPost()` Hook

---

### 4.4 임시 저장 API

#### POST /api/community/drafts
**요청**:
```typescript
{
  category: 'case' | 'qa' | 'info';
  title: string;
  content: string;
}
```

**응답** (201 Created):
```typescript
{
  draft: {
    id: string;
    updated_at: string;
  }
}
```

**요구사항**:
- 30초마다 자동 저장 (SR-002)
- 임시 저장 기간: 7일 (이후 자동 삭제)

**구현**: `communityService.upsertDraft()` + `useDraft()` Hook

---

## ✅ 테스트 현황

### 단위 테스트
| 파일 | 테스트 수 | 상태 | 커버리지 |
|------|----------|------|---------|
| `post.validator.test.ts` | 20 | ✅ 100% | 100% |
| `comment.validator.test.ts` | 10 | ✅ 100% | 100% |
| `nickname-generator.test.ts` | 14 | ✅ 100% | 100% |
| `community-service.test.ts` | 16 | ✅ 100% | 100% |

**총 60개 테스트 100% 통과** ✅

### E2E 테스트 (예정, Supabase 연결 후)
| 파일 | 목표 | 상태 |
|------|------|------|
| `post-create.e2e.test.ts` | 게시글 작성 플로우 | ⏳ 예정 |
| `post-list.e2e.test.ts` | 게시글 목록 조회 | ⏳ 예정 |
| `post-detail.e2e.test.ts` | 게시글 상세 조회 | ⏳ 예정 |
| `comment-create.e2e.test.ts` | 댓글 작성 | ⏳ 예정 |
| `post-report.e2e.test.ts` | 게시글 신고 | ⏳ 예정 |
| `draft.e2e.test.ts` | 임시 저장 | ⏳ 예정 |

---

## 🚀 다음 단계

### 1. API Routes 구현 (우선순위: High)
- [ ] `src/app/api/community/` 디렉토리 생성
- [ ] 6개 엔드포인트 구현 (POST/GET)
- [ ] JWT 인증 미들웨어
- [ ] 에러 처리 및 로깅

### 2. E2E 테스트 구현
- [ ] Supabase 데이터베이스 연결
- [ ] 6개 E2E 테스트 작성 (Playwright)
- [ ] 성능 테스트 추가

### 3. 추가 UI 페이지 (선택적)
- [ ] `/community/new` - 게시글 작성 페이지
- [ ] `/community/[id]` - 게시글 상세 페이지
- [ ] 댓글 섹션 컴포넌트 통합

### 4. 성능 최적화
- [ ] 이미지 업로드 (Supabase Storage + CDN)
- [ ] 무한 스크롤 또는 페이지네이션
- [ ] 서버 캐싱 전략 (Next.js revalidation)

### 5. SPEC 완성 및 배포
- [ ] SPEC status: draft → active (E2E 테스트 통과 시)
- [ ] 통합 테스트 실행
- [ ] 프로덕션 배포 (Vercel)
- [ ] 모니터링 & 로깅

---

## 📖 참고 문서

- [SPEC-COMMUNITY-001 (전체 명세)](../.moai/specs/SPEC-COMMUNITY-001/spec.md)
- [Supabase 스키마](../.moai/specs/SPEC-COMMUNITY-001/supabase-schema.sql)
- [개발 가이드](./.moai/memory/development-guide.md)
- [TRUST 5원칙](./.moai/memory/development-guide.md#trust-5원칙)

---

**최종 업데이트**: 2025-10-22
**작성자**: @Alfred (doc-syncer)
**상태**: Draft (70% Complete, E2E 테스트 대기)
