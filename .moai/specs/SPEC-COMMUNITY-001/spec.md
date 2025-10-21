---
# 필수 필드 (7개)
id: COMMUNITY-001
version: 0.0.3
status: draft
created: 2025-10-21
updated: 2025-10-21
author: @Alfred
priority: high

# 선택 필드 - 분류/메타
category: feature
labels:
  - community
  - anonymous
  - teacher-support

# 선택 필드 - 관계 (의존성 그래프)
depends_on:
  - AUTH-001
related_specs:
  - NOTIFICATION-001
  - ADMIN-001

# 선택 필드 - 범위 (영향 분석)
scope:
  packages:
    - src/features/community
    - src/lib/validators
  files:
    - community-service.ts
    - post-validator.ts
    - comment-validator.ts
---

# @SPEC:COMMUNITY-001: 커뮤니티 게시판 시스템

## HISTORY

### v0.0.3 (2025-10-21)
- **ADDED**: Service Layer 구현 완료 (8개 서비스 함수)
- **ADDED**: Supabase 데이터베이스 스키마 (4 tables, RLS policies, triggers)
- **CHANGED**: community.types.ts에 Input 타입 5개 추가
- **AUTHOR**: @Alfred
- **TEST**: 16/16 service layer tests (nickname logic + type safety + SPEC mapping)
- **NOTE**: Service Layer 완료, UI Layer는 Supabase 데이터베이스 연결 후 구현 예정
- **FILES**:
  - src/lib/services/community-service.ts (562 LOC) - NEW
  - tests/lib/services/community-service.test.ts (112 LOC) - NEW
  - .moai/specs/SPEC-COMMUNITY-001/supabase-schema.sql (254 LOC) - NEW
  - src/types/community.types.ts (+45 LOC for Input types)

### v0.0.2 (2025-10-21)
- **CHANGED**: 기초 레이어 구현 완료 (Validation, Types, Utils)
- **AUTHOR**: @Alfred
- **NOTE**: 서비스 레이어는 Supabase 스키마 생성 후 구현 예정
- **TEST**: 44/44 tests passing (100% coverage for implemented layers)
- **COMMITS**: 823f314 (validators), 6451d3e (types + utils)
- **FILES**:
  - src/lib/validators/post.validator.ts (81 LOC)
  - src/lib/validators/comment.validator.ts (28 LOC)
  - src/types/community.types.ts (98 LOC)
  - src/lib/utils/nickname-generator.ts (42 LOC)
  - tests/lib/validators/post.validator.test.ts (254 LOC)
  - tests/lib/validators/comment.validator.test.ts (95 LOC)
  - tests/lib/utils/nickname-generator.test.ts (110 LOC)

### v0.0.1 (2025-10-21)
- **INITIAL**: 교사 간 익명 경험 공유 커뮤니티 게시판 시스템 명세 작성
- **AUTHOR**: @Alfred
- **REASON**: MAU +50% 증대를 위한 플랫폼 체류 시간 증가 전략, 교사 간 상호 지원 플랫폼 구축

---

## 1. Overview

### 비즈니스 목표
교사 간 익명 경험 공유 및 상호 지원 플랫폼을 통해 유사 사례 해결 방법을 공유하고, 플랫폼 체류 시간을 증가시켜 MAU +50% 증대 목표 달성

### 핵심 가치 제안
- **익명성 보장**: 민감한 사례 공유 시 신원 노출 걱정 없이 자유로운 소통
- **카테고리 분류**: 사례 공유, Q&A, 정보 공유 등 목적별 게시판 구분
- **커뮤니티 중재**: 부적절 콘텐츠 신고 및 자동 관리 시스템

---

## 2. EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)
시스템은 다음 핵심 기능을 제공해야 한다:

- **UR-001**: 시스템은 익명 게시글 작성 기능을 제공해야 한다
- **UR-002**: 시스템은 카테고리별 게시판을 제공해야 한다
  - 사례 공유 (Case Study)
  - Q&A (질문과 답변)
  - 정보 공유 (Information)
- **UR-003**: 시스템은 댓글 작성 기능을 제공해야 한다
- **UR-004**: 시스템은 게시글 검색 기능을 제공해야 한다 (제목, 본문, 카테고리)
- **UR-005**: 시스템은 부적절한 콘텐츠 신고 기능을 제공해야 한다

### Event-driven Requirements (이벤트 기반)
WHEN [조건]이면, 시스템은 다음과 같이 동작해야 한다:

- **ER-001**: WHEN 사용자가 게시글을 작성하면, 시스템은 자동으로 익명 닉네임을 부여해야 한다
  - 형식: "익명교사###" (### = 랜덤 3자리 숫자)
  - 같은 게시글 내에서 동일 사용자는 동일 닉네임 유지
- **ER-002**: WHEN 게시글이 발행되면, 시스템은 해당 카테고리 구독자에게 알림을 전송해야 한다
- **ER-003**: WHEN 부적절한 콘텐츠가 신고되면, 시스템은 관리자에게 알림을 전송해야 한다
  - 신고 횟수 3회 이상 시 자동 블라인드 처리
- **ER-004**: WHEN 게시글이 조회수 100회를 초과하면, 시스템은 "인기 게시글" 배지를 표시해야 한다
- **ER-005**: WHEN 댓글 작성 시, 시스템은 게시글 작성자에게 알림을 전송해야 한다

### State-driven Requirements (상태 기반)
WHILE [상태]일 때, 시스템은 다음과 같이 동작해야 한다:

- **SR-001**: WHILE 사용자가 인증된 상태일 때, 시스템은 댓글 작성을 허용해야 한다
- **SR-002**: WHILE 게시글 작성 중일 때, 시스템은 30초마다 임시 저장 기능을 자동 실행해야 한다
- **SR-003**: WHILE 게시글이 블라인드 상태일 때, 시스템은 일반 사용자에게 콘텐츠를 숨겨야 한다
  - 관리자와 작성자에게만 표시

### Optional Features (선택적 기능)
WHERE [조건]이면, 시스템은 다음 기능을 제공할 수 있다:

- **OF-001**: WHERE 사용자가 요청하면, 시스템은 게시글 북마크 기능을 제공할 수 있다
- **OF-002**: WHERE 사용자가 요청하면, 시스템은 게시글 공유 기능(링크 복사)을 제공할 수 있다
- **OF-003**: WHERE 사용자가 요청하면, 시스템은 댓글 좋아요 기능을 제공할 수 있다

### Constraints (제약사항)
시스템은 다음 제약을 준수해야 한다:

- **C-001**: 게시글 제목은 5~100자 제한
- **C-002**: 게시글 본문은 20~5000자 제한
- **C-003**: 첨부 파일은 최대 5MB, 이미지만 허용 (PNG, JPG, GIF)
- **C-004**: 댓글은 최대 500자 제한
- **C-005**: 익명 닉네임은 "익명교사###" 형식 (### = 랜덤 3자리 숫자 001~999)
- **C-006**: 게시글 작성 간격은 최소 10초 (스팸 방지)
- **C-007**: 같은 사용자는 동일 게시글에 1회만 신고 가능

---

## 3. 데이터 모델

### 3.1 posts (게시글)
```typescript
interface Post {
  id: string;                  // UUID
  category: 'case' | 'qa' | 'info';  // 카테고리
  title: string;               // 제목 (5~100자)
  content: string;             // 본문 (20~5000자)
  author_id: string;           // 작성자 ID (FK: users.id)
  anonymous_nickname: string;  // 익명 닉네임 (예: "익명교사123")
  view_count: number;          // 조회수 (default: 0)
  is_popular: boolean;         // 인기 게시글 여부 (view_count >= 100)
  is_blinded: boolean;         // 블라인드 여부 (default: false)
  image_url?: string;          // 첨부 이미지 URL (optional)
  created_at: Date;
  updated_at: Date;
}
```

### 3.2 comments (댓글)
```typescript
interface Comment {
  id: string;                  // UUID
  post_id: string;             // 게시글 ID (FK: posts.id)
  author_id: string;           // 작성자 ID (FK: users.id)
  anonymous_nickname: string;  // 익명 닉네임 (게시글별 고정)
  content: string;             // 댓글 내용 (1~500자)
  created_at: Date;
  updated_at: Date;
}
```

### 3.3 post_reports (게시글 신고)
```typescript
interface PostReport {
  id: string;                  // UUID
  post_id: string;             // 신고 대상 게시글 ID (FK: posts.id)
  reporter_id: string;         // 신고자 ID (FK: users.id)
  reason: string;              // 신고 사유 (1~200자)
  status: 'pending' | 'approved' | 'rejected';  // 처리 상태
  created_at: Date;
  resolved_at?: Date;          // 처리 완료 시간
}
```

### 3.4 post_drafts (임시 저장)
```typescript
interface PostDraft {
  id: string;                  // UUID
  author_id: string;           // 작성자 ID (FK: users.id)
  category: 'case' | 'qa' | 'info';
  title: string;               // 임시 제목
  content: string;             // 임시 본문
  created_at: Date;
  updated_at: Date;            // 마지막 자동 저장 시간
}
```

---

## 4. API 설계

### 4.1 게시글 API

#### POST /api/community/posts
게시글 작성

**Request Body**:
```typescript
{
  category: 'case' | 'qa' | 'info';
  title: string;        // 5~100자
  content: string;      // 20~5000자
  image?: File;         // optional, max 5MB
}
```

**Response** (201 Created):
```typescript
{
  post: {
    id: string;
    category: string;
    title: string;
    content: string;
    anonymous_nickname: string;  // 자동 생성
    view_count: 0;
    is_popular: false;
    created_at: string;
  }
}
```

#### GET /api/community/posts
게시글 목록 조회 (페이지네이션)

**Query Parameters**:
```typescript
{
  category?: 'case' | 'qa' | 'info';  // optional
  page?: number;       // default: 1
  limit?: number;      // default: 20, max: 100
  sort?: 'latest' | 'popular';  // default: 'latest'
}
```

**Response** (200 OK):
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

#### GET /api/community/posts/:id
게시글 상세 조회 (조회수 +1)

**Response** (200 OK):
```typescript
{
  post: Post;
  comments: Comment[];  // 댓글 목록
}
```

### 4.2 댓글 API

#### POST /api/community/posts/:id/comments
댓글 작성

**Request Body**:
```typescript
{
  content: string;  // 1~500자
}
```

**Response** (201 Created):
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

### 4.3 신고 API

#### POST /api/community/posts/:id/report
게시글 신고

**Request Body**:
```typescript
{
  reason: string;  // 1~200자
}
```

**Response** (201 Created):
```typescript
{
  report: {
    id: string;
    status: 'pending';
    created_at: string;
  }
}
```

### 4.4 임시 저장 API

#### POST /api/community/drafts
임시 저장

**Request Body**:
```typescript
{
  category: 'case' | 'qa' | 'info';
  title: string;
  content: string;
}
```

**Response** (201 Created):
```typescript
{
  draft: {
    id: string;
    updated_at: string;
  }
}
```

---

## 5. 성능 요구사항

### 5.1 응답 시간
- **P-001**: 게시글 목록 조회 API는 500ms 이내 응답해야 한다 (20개 게시글 기준)
- **P-002**: 게시글 상세 조회 API는 300ms 이내 응답해야 한다
- **P-003**: 댓글 작성 API는 200ms 이내 응답해야 한다

### 5.2 처리량
- **P-004**: 시스템은 동시 접속자 1,000명을 지원해야 한다
- **P-005**: 시스템은 초당 100개 게시글 조회 요청을 처리해야 한다

### 5.3 확장성
- **P-006**: 게시글 목록은 페이지네이션을 통해 100,000개 이상 게시글을 효율적으로 처리해야 한다
- **P-007**: 이미지 업로드는 Supabase Storage를 활용하여 CDN 캐싱을 지원해야 한다

---

## 6. 보안 요구사항

### 6.1 인증/인가
- **S-001**: 모든 게시글/댓글 작성 API는 JWT 인증을 요구해야 한다
- **S-002**: 신고 API는 인증된 사용자만 접근 가능해야 한다
- **S-003**: 게시글 수정/삭제는 작성자 본인만 가능해야 한다

### 6.2 데이터 검증
- **S-004**: 게시글 제목/본문은 XSS 공격 방지를 위해 HTML 태그를 이스케이프해야 한다
- **S-005**: 이미지 업로드 시 파일 확장자 및 MIME 타입을 검증해야 한다
- **S-006**: SQL Injection 방지를 위해 Prepared Statement 또는 ORM을 사용해야 한다

### 6.3 스팸 방지
- **S-007**: 게시글 작성은 10초 간격 제한 (rate limiting)
- **S-008**: 동일 IP에서 1분 내 5회 이상 신고 시 차단해야 한다
- **S-009**: 신고 횟수 3회 이상 게시글은 자동 블라인드 처리되어야 한다

---

## 7. 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5.6.3** (strict mode)
- **React Query 5.56.0** (서버 상태 관리)
- **Tailwind CSS** (스타일링)

### Backend
- **Supabase** (PostgreSQL + Realtime)
- **Supabase Storage** (이미지 업로드)
- **Supabase Auth** (JWT 인증)

### Testing
- **Vitest** (단위 테스트)
- **React Testing Library** (컴포넌트 테스트)
- **Playwright** (E2E 테스트)

---

## 8. 구현 우선순위

### 1차 목표 (Core Features)
- [ ] 게시글 작성/조회 기능 (익명 닉네임 자동 부여)
- [ ] 카테고리별 게시판 (case, qa, info)
- [ ] 댓글 작성/조회 기능

### 2차 목표 (Extended Features)
- [ ] 게시글 검색 기능 (제목, 본문, 카테고리)
- [ ] 임시 저장 기능 (30초마다 자동 저장)
- [ ] 인기 게시글 배지 (조회수 100회 이상)

### 3차 목표 (Community Moderation)
- [ ] 부적절 콘텐츠 신고 기능
- [ ] 자동 블라인드 처리 (신고 3회 이상)
- [ ] 관리자 알림 시스템

### 4차 목표 (Optional Features)
- [ ] 게시글 북마크 기능
- [ ] 게시글 공유 기능 (링크 복사)
- [ ] 댓글 좋아요 기능

---

## 9. 테스트 계획

### 9.1 단위 테스트
- **익명 닉네임 생성 로직** (정규식 검증, 중복 방지)
- **게시글 검증 로직** (제목/본문 길이, 이미지 파일 크기/타입)
- **신고 중복 방지 로직** (같은 사용자 1회만 신고)

### 9.2 통합 테스트
- **게시글 작성 → 조회 → 댓글 작성 플로우**
- **신고 3회 → 자동 블라인드 플로우**
- **임시 저장 → 게시글 발행 플로우**

### 9.3 E2E 테스트
- **사용자 시나리오**: 게시글 작성 → 댓글 작성 → 신고
- **익명성 검증**: 같은 게시글 내 동일 닉네임 유지
- **성능 테스트**: 100개 게시글 목록 조회 속도

---

## 10. Traceability (추적성)

### TAG 체계
- `@SPEC:COMMUNITY-001` - 본 명세 문서
- `@TEST:COMMUNITY-001` - 테스트 코드 (tests/community/)
- `@CODE:COMMUNITY-001` - 구현 코드 (src/features/community/)
- `@DOC:COMMUNITY-001` - Living Document (docs/community.md)

### 의존성
- **depends_on**: AUTH-001 (사용자 인증 시스템)
- **related_specs**: NOTIFICATION-001 (알림 시스템), ADMIN-001 (관리자 시스템)

---

**최종 업데이트**: 2025-10-21
**작성자**: @Alfred
**버전**: 0.0.1 (INITIAL)
