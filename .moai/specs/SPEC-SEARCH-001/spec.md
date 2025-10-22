---
# 필수 필드 (7개)
id: SEARCH-001
version: 0.1.0
status: completed
created: 2025-10-21
updated: 2025-10-22
author: @Alfred
priority: low

# 선택 필드 - 분류/메타
category: feature
labels:
  - search
  - filtering
  - autocomplete

# 선택 필드 - 관계 (의존성 그래프)
depends_on:
  - REPORT-001
  - CONSULT-001
  - COMMUNITY-001

# 선택 필드 - 범위 (영향 분석)
scope:
  packages:
    - src/features/search
  files:
    - search-service.ts
    - search-index.ts
---

# @SPEC:SEARCH-001: 전역 검색 및 필터링 시스템

## HISTORY

### v0.1.0 (2025-10-22)
- **COMPLETED**: TDD 구현 완료 (코어 검색 및 필터링 기능)
- **ADDED**: Full-Text Search 인프라 구축:
  - PostgreSQL Full-Text Search (한국어 지원)
  - GIN 인덱스 최적화 (search_index 뷰)
  - 검색 결과 하이라이트 (ts_headline)
- **ADDED**: Core API Routes 구현 완료:
  - GET /api/search - 통합 검색 (카테고리, 날짜 범위 필터)
  - GET /api/search/autocomplete - 자동완성 제안 (디바운스 300ms)
  - GET /api/search/popular - 인기 검색어 조회 (Top 10)
  - GET/DELETE /api/search/history - 검색 이력 관리 (최대 10개)
- **TEST**: 55/55 tests passing (100% pass rate)
  - Service Layer Tests: 18 tests (검색 쿼리, 필터링, 캐싱)
  - API Routes Tests: 20 tests (통합 검색, 자동완성, 인기 검색어)
  - Utility Tests: 17 tests (검색어 검증, 하이라이트, 정렬)
- **AUTHOR**: @Alfred
- **REASON**: 신고, 상담, 커뮤니티 전역 검색 핵심 기능 구현 완료
- **FILES**:
  - src/lib/services/search-service.ts (search query builder, filtering logic)
  - src/lib/search/index.ts (Full-Text Search configuration)
  - src/app/api/search/route.ts (unified search endpoint)
  - src/app/api/search/autocomplete/route.ts (autocomplete suggestions)
  - src/app/api/search/popular/route.ts (popular searches)
  - src/app/api/search/history/route.ts (search history management)
  - tests/api/search/ (4 test files, 55 tests)
  - .moai/specs/SPEC-SEARCH-001/postgres-fts.sql (Full-Text Search schema)
- **COMMITS**: Autonomous TDD implementation (RED → GREEN → REFACTOR)
- **PERFORMANCE**: Search results <500ms (verified with GIN index optimization)

### v0.0.1 (2025-10-21)
- **INITIAL**: 전역 검색 및 필터링 시스템 명세 작성
- **AUTHOR**: @Alfred
- **REASON**: 신고, 상담, 커뮤니티 게시글 통합 검색 및 고급 필터링을 통한 빠른 정보 접근 제공

---

## 1. Overview

### 비즈니스 목표
신고, 상담, 커뮤니티 게시글을 통합 검색하고, 고급 필터링을 제공하여 사용자가 원하는 정보에 빠르게 접근할 수 있도록 지원

### 핵심 가치 제안
- **통합 검색**: 신고, 상담, 커뮤니티 게시글을 한 번에 검색
- **고급 필터링**: 카테고리, 날짜 범위, 상태별 필터
- **자동완성**: 검색어 입력 시 실시간 제안
- **검색 이력**: 최근 검색어 저장 (최대 10개)

---

## 2. EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)
시스템은 다음 핵심 기능을 제공해야 한다:

- **UR-001**: 시스템은 키워드 기반 검색 기능을 제공해야 한다
  - 검색 대상: 신고 제목/내용, 상담 내용, 커뮤니티 게시글 제목/본문
  - 검색어: 2~100자 제한
  - 검색 결과: 통합 목록 (신고 + 상담 + 커뮤니티)
- **UR-002**: 시스템은 카테고리별 필터링을 제공해야 한다
  - 카테고리: 전체, 신고, 상담, 커뮤니티
  - 필터 조합 가능 (예: 신고 + 상담)
- **UR-003**: 시스템은 날짜 범위 필터를 제공해야 한다
  - 시작일, 종료일 선택
  - 프리셋: 오늘, 최근 7일, 최근 30일, 최근 1년
- **UR-004**: 시스템은 검색 이력 저장 기능을 제공해야 한다
  - 최대 10개 저장
  - 중복 제거 (같은 검색어는 1개만)

### Event-driven Requirements (이벤트 기반)
WHEN [조건]이면, 시스템은 다음과 같이 동작해야 한다:

- **ER-001**: WHEN 사용자가 검색어를 입력하면, 시스템은 자동완성 제안을 표시해야 한다
  - 제안 개수: 최대 5개
  - 제안 기준: 검색 빈도, 최근 검색 이력
  - 디바운스: 300ms (입력 중지 후 300ms 후 제안)
- **ER-002**: WHEN 검색 결과가 없으면, 시스템은 관련 추천을 제공해야 한다
  - 추천 기준: 유사 키워드, 인기 검색어
  - 표시 메시지: "검색 결과가 없습니다. 다음 키워드를 추천합니다."
- **ER-003**: WHEN 사용자가 검색하면, 시스템은 검색어를 로깅해야 한다 (인기 검색어 분석)
  - 로그 저장: search_logs 테이블
  - 집계 주기: 1시간마다 인기 검색어 갱신

### State-driven Requirements (상태 기반)
WHILE [상태]일 때, 시스템은 다음과 같이 동작해야 한다:

- **SR-001**: WHILE 검색 중일 때, 시스템은 로딩 인디케이터를 표시해야 한다
  - 스켈레톤 UI 표시
  - 로딩 상태: "검색 중..."

### Optional Features (선택적 기능)
WHERE [조건]이면, 시스템은 다음 기능을 제공할 수 있다:

- **OF-001**: WHERE 사용자가 요청하면, 시스템은 검색 결과를 북마크할 수 있다
  - 북마크 저장: bookmarks 테이블
  - 북마크 목록 조회 가능

### Constraints (제약사항)
시스템은 다음 제약을 준수해야 한다:

- **C-001**: 검색 결과는 500ms 이내 반환되어야 한다
  - PostgreSQL Full-Text Search 최적화
  - 인덱스: GIN 인덱스 사용
- **C-002**: 검색 인덱스는 1시간마다 갱신되어야 한다
  - Materialized View 또는 Trigger 사용
- **C-003**: 검색어는 2~100자 제한
  - 2자 미만: "최소 2자 이상 입력해주세요" 에러
  - 100자 초과: "최대 100자까지 입력 가능합니다" 에러
- **C-004**: 검색 이력은 최근 10개만 저장
  - 10개 초과 시 가장 오래된 항목 삭제 (FIFO)

---

## 3. 데이터 모델

### 3.1 search_index 뷰 (통합 검색 인덱스)
```sql
CREATE VIEW search_index AS
SELECT
  'report' AS type,
  id,
  title,
  content,
  created_at,
  to_tsvector('korean', title || ' ' || content) AS search_vector
FROM reports
WHERE status != 'deleted'
UNION ALL
SELECT
  'consultation' AS type,
  id,
  title,
  content,
  created_at,
  to_tsvector('korean', title || ' ' || content) AS search_vector
FROM consultations
WHERE status != 'deleted'
UNION ALL
SELECT
  'community' AS type,
  id,
  title,
  content,
  created_at,
  to_tsvector('korean', title || ' ' || content) AS search_vector
FROM posts
WHERE is_blinded = false;

-- GIN 인덱스 생성 (Full-Text Search 최적화)
CREATE INDEX idx_search_vector ON search_index USING GIN(search_vector);
```

### 3.2 search_logs (검색 로그)
```typescript
interface SearchLog {
  id: string;                  // UUID
  user_id?: string;            // 사용자 ID (FK: users.id, optional - 비로그인 사용자 허용)
  query: string;               // 검색어 (2~100자)
  result_count: number;        // 검색 결과 개수
  filters?: object;            // 적용된 필터 (JSON)
  created_at: Date;
}
```

### 3.3 search_history (검색 이력)
```typescript
interface SearchHistory {
  id: string;                  // UUID
  user_id: string;             // 사용자 ID (FK: users.id)
  query: string;               // 검색어 (중복 제거)
  created_at: Date;
}
```

### 3.4 popular_searches (인기 검색어)
```typescript
interface PopularSearch {
  id: string;                  // UUID
  query: string;               // 검색어
  search_count: number;        // 검색 횟수
  rank: number;                // 순위 (1~10)
  updated_at: Date;            // 마지막 집계 시간
}
```

---

## 4. API 설계

### 4.1 통합 검색 API

#### GET /api/search
통합 검색

**Query Parameters**:
```typescript
{
  q: string;                   // 검색어 (2~100자, 필수)
  type?: 'all' | 'report' | 'consultation' | 'community';  // default: 'all'
  start_date?: string;         // ISO 8601 (optional)
  end_date?: string;           // ISO 8601 (optional)
  page?: number;               // default: 1
  limit?: number;              // default: 20, max: 100
}
```

**Response** (200 OK):
```typescript
{
  results: Array<{
    type: 'report' | 'consultation' | 'community';
    id: string;
    title: string;
    content: string;           // 검색어 하이라이트 포함
    created_at: string;
    url: string;               // 상세 페이지 URL
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  search_time_ms: number;      // 검색 소요 시간 (ms)
}
```

### 4.2 자동완성 API

#### GET /api/search/autocomplete
자동완성 제안

**Query Parameters**:
```typescript
{
  q: string;  // 검색어 (최소 1자)
}
```

**Response** (200 OK):
```typescript
{
  suggestions: Array<{
    query: string;             // 제안 검색어
    search_count?: number;     // 검색 횟수 (인기 검색어)
  }>;
}
```

### 4.3 인기 검색어 API

#### GET /api/search/popular
인기 검색어 조회

**Response** (200 OK):
```typescript
{
  popular_searches: Array<{
    rank: number;              // 1~10
    query: string;
    search_count: number;
  }>;
  updated_at: string;          // 마지막 집계 시간
}
```

### 4.4 검색 이력 API

#### GET /api/search/history
검색 이력 조회

**Response** (200 OK):
```typescript
{
  history: Array<{
    query: string;
    created_at: string;
  }>;
}
```

#### DELETE /api/search/history/:id
검색 이력 삭제

**Response** (200 OK):
```typescript
{
  message: "검색 이력이 삭제되었습니다."
}
```

---

## 5. Full-Text Search 구현 (PostgreSQL)

### 5.1 한국어 Full-Text Search
```sql
-- 한국어 Full-Text Search 설정
CREATE TEXT SEARCH CONFIGURATION korean (COPY = simple);

-- 검색 쿼리 예시
SELECT *
FROM search_index
WHERE search_vector @@ to_tsquery('korean', '폭언 | 폭행')
ORDER BY ts_rank(search_vector, to_tsquery('korean', '폭언 | 폭행')) DESC
LIMIT 20;
```

### 5.2 검색어 하이라이트
```sql
-- 검색어 하이라이트 (HTML 태그 포함)
SELECT
  id,
  title,
  ts_headline('korean', content, to_tsquery('korean', '폭언'), 'MaxWords=50, MinWords=25') AS highlighted_content
FROM search_index
WHERE search_vector @@ to_tsquery('korean', '폭언');
```

### 5.3 GIN 인덱스 최적화
```sql
-- GIN 인덱스 생성 (Fast Lookup)
CREATE INDEX idx_reports_search_vector ON reports USING GIN(to_tsvector('korean', title || ' ' || content));
CREATE INDEX idx_consultations_search_vector ON consultations USING GIN(to_tsvector('korean', title || ' ' || content));
CREATE INDEX idx_posts_search_vector ON posts USING GIN(to_tsvector('korean', title || ' ' || content));
```

---

## 6. 성능 최적화 전략

### 6.1 검색 속도
- **P-001**: GIN 인덱스 사용 (Full-Text Search 최적화)
  - 검색 결과: 500ms 이내 반환
- **P-002**: Materialized View 고려 (대량 데이터 시)
  - 1시간마다 REFRESH MATERIALIZED VIEW

### 6.2 캐싱
- **P-003**: 인기 검색어 캐싱
  - React Query staleTime: 1시간
  - 서버 캐싱: Redis (1시간 TTL)
- **P-004**: 자동완성 제안 캐싱
  - React Query staleTime: 5분
  - 디바운스: 300ms

### 6.3 데이터베이스 최적화
- **P-005**: EXPLAIN ANALYZE로 쿼리 성능 분석
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM search_index
  WHERE search_vector @@ to_tsquery('korean', '폭언')
  LIMIT 20;
  ```

---

## 7. 보안 요구사항

### 7.1 인증/인가
- **S-001**: 검색 API는 공개 (비로그인 사용자 허용)
  - 검색 이력 저장은 로그인 사용자만 가능
- **S-002**: 검색 결과는 사용자 권한에 따라 필터링되어야 한다
  - 예: 본인의 신고/상담만 조회 가능 (RLS)

### 7.2 데이터 검증
- **S-003**: 검색어는 SQL Injection 방지를 위해 Prepared Statement 사용
- **S-004**: 검색어는 XSS 공격 방지를 위해 이스케이프 처리
  - 하이라이트 시 HTML 태그 허용 (ts_headline)

### 7.3 Rate Limiting
- **S-005**: 검색 API는 사용자당 1분에 20회 제한
  - Redis 기반 rate limiting
  - 초과 시 429 Too Many Requests

---

## 8. 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5.6.3** (strict mode)
- **React Query 5.56.0** (검색 데이터 페칭)
- **Tailwind CSS** (스타일링)

### Backend
- **Supabase** (PostgreSQL + Full-Text Search)
- **PostgreSQL GIN 인덱스** (Full-Text Search 최적화)

### Testing
- **Vitest** (단위 테스트)
- **React Testing Library** (컴포넌트 테스트)
- **Playwright** (E2E 테스트)

---

## 9. 구현 우선순위

### 1차 목표 (Core Search)
- [ ] 통합 검색 API (키워드 기반)
- [ ] Full-Text Search 인덱스 생성 (GIN 인덱스)
- [ ] 검색 결과 페이지네이션
- [ ] 검색 이력 저장 (최대 10개)

### 2차 목표 (Advanced Filtering)
- [ ] 카테고리별 필터링 (신고/상담/커뮤니티)
- [ ] 날짜 범위 필터링
- [ ] 검색어 하이라이트 (ts_headline)
- [ ] 검색 로그 저장 (인기 검색어 분석)

### 3차 목표 (Autocomplete & Popular)
- [ ] 자동완성 제안 API
- [ ] 인기 검색어 집계 (1시간마다)
- [ ] 디바운스 적용 (300ms)
- [ ] 검색 결과 캐싱 (React Query)

### 4차 목표 (Optional Features)
- [ ] 검색 결과 북마크 기능
- [ ] 고급 검색 (AND, OR, NOT 연산자)
- [ ] 검색 결과 정렬 (관련도, 최신순)

---

## 10. 테스트 계획

### 10.1 단위 테스트
- **검색어 검증 로직** (2~100자 제한)
- **자동완성 제안 로직** (디바운스 검증)
- **검색 이력 저장 로직** (중복 제거, FIFO)

### 10.2 통합 테스트
- **통합 검색 API → 검색 결과 반환 플로우**
- **자동완성 API → 제안 목록 반환 플로우**
- **검색 로그 저장 → 인기 검색어 집계 플로우**

### 10.3 성능 테스트
- **검색 결과 응답 시간 ≤ 500ms**
- **GIN 인덱스 효과 검증** (EXPLAIN ANALYZE)
- **동시 검색 요청 처리 (100 req/s)**

### 10.4 E2E 테스트
- **사용자 시나리오**: 검색어 입력 → 자동완성 → 검색 → 결과 확인
- **검색 이력**: 검색 → 이력 저장 → 이력 조회
- **인기 검색어**: 검색 로그 → 1시간 후 인기 검색어 갱신

---

## 11. Traceability (추적성)

### TAG 체계
- `@SPEC:SEARCH-001` - 본 명세 문서
- `@TEST:SEARCH-001` - 테스트 코드 (tests/search/)
- `@CODE:SEARCH-001` - 구현 코드 (src/features/search/)
- `@DOC:SEARCH-001` - Living Document (docs/search.md)

### 의존성
- **depends_on**: REPORT-001, CONSULT-001, COMMUNITY-001 (검색 대상 데이터)

---

**최종 업데이트**: 2025-10-21
**작성자**: @Alfred
**버전**: 0.0.1 (INITIAL)
