# COMMUNITY-001 E2E Tests

**@TEST:COMMUNITY-001** | SPEC: `.moai/specs/SPEC-COMMUNITY-001/spec.md`

## 테스트 준비

### 1. Supabase 테스트 데이터 생성

Supabase Dashboard > SQL Editor에서 다음 스크립트 실행:

```bash
# 파일 위치
.moai/specs/SPEC-COMMUNITY-001/seed-test-data.sql
```

이 스크립트는 다음 데이터를 생성합니다:
- 게시글 10개 (인기 게시글 2개 포함)
- 댓글 13개
- 임시 저장 2개
- 신고 2개

### 2. E2E 테스트 실행

```bash
# 개발 서버 실행 (별도 터미널)
npm run dev

# E2E 테스트 실행
npm run test:e2e

# 특정 테스트만 실행
npm test -- tests/e2e/community/post-list.e2e.test.ts
```

## 테스트 시나리오

### UR-002: 게시글 목록 조회
- **파일**: `post-list.e2e.test.ts`
- **테스트 케이스**:
  1. 전체 게시글 목록 조회
  2. 카테고리 필터링 (case/qa/info)
  3. 정렬 (최신순/인기순)
  4. 페이지네이션
  5. 빈 상태 처리

### UR-001: 게시글 작성
- **파일**: `post-create.e2e.test.ts`
- **테스트 케이스**:
  1. 게시글 작성 폼 렌더링
  2. 유효성 검증 (제목 5-100자, 본문 20-5000자)
  3. 카테고리 선택
  4. 게시글 작성 성공
  5. 작성 후 상세 페이지로 리다이렉트

### UR-003: 게시글 상세 조회 및 댓글
- **파일**: `post-detail.e2e.test.ts`
- **테스트 케이스**:
  1. 게시글 상세 조회
  2. 댓글 목록 표시
  3. 댓글 작성
  4. 블라인드 게시글 처리

### UR-005: 게시글 신고
- **파일**: `post-report.e2e.test.ts`
- **테스트 케이스**:
  1. 신고 폼 표시
  2. 신고 사유 입력 (1-200자)
  3. 신고 제출 성공
  4. 신고 3회 누적 시 자동 블라인드

### SR-002: 임시 저장
- **파일**: `draft-save.e2e.test.ts`
- **테스트 케이스**:
  1. 수동 임시 저장
  2. 자동 임시 저장 (30초)
  3. 임시 저장 데이터 복구

## 테스트 환경

- **Framework**: Vitest + Testing Library
- **환경 변수**: `.env.local` (Supabase 연결 정보)
- **테스트 서버**: http://localhost:3000 (개발 서버)
- **병렬 실행**: 비활성화 (Supabase 공유 데이터베이스)

## 주의 사항

1. **테스트 격리**: 각 테스트는 독립적으로 실행되어야 함
2. **데이터 정리**: 테스트 후 생성된 데이터는 `beforeEach/afterEach`에서 정리
3. **타임아웃**: 네트워크 요청은 5초 타임아웃 설정
4. **재시도**: 실패 시 최대 1회 재시도
