# T119 배포 가이드

> **생성일**: 2025-10-22
> **목적**: DB 마이그레이션 적용 및 환경 변수 설정 가이드

---

## 1. Supabase 마이그레이션 적용

### 1.1 필수 마이그레이션 파일 (순서대로 적용)

다음 6개의 마이그레이션을 **Supabase Dashboard → SQL Editor**에서 순서대로 실행하세요:

#### ① `20251020000002_add_report_columns.sql` - Reports 테이블 컬럼 추가
**목적**: 통계 뷰 생성 전 필수 컬럼 추가

**적용 방법**:
```sql
-- Supabase Dashboard → SQL Editor → New Query
-- 파일 내용 전체 복사 붙여넣기 → Run

-- 검증 쿼리:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'reports' AND column_name IN ('type', 'region', 'school_level', 'school_name');
```

**생성 객체**:
- 컬럼: `reports.type`, `reports.region`, `reports.school_level`, `reports.school_name`
- 인덱스: `idx_reports_type`, `idx_reports_region`, `idx_reports_school_level`

---

#### ② `20251020000003_add_consultation_columns.sql` - Consultations 테이블 컬럼 추가
**목적**: 검색 시스템 구축 전 필수 컬럼 추가

**적용 방법**:
```sql
-- Supabase Dashboard → SQL Editor → New Query
-- 파일 내용 전체 복사 붙여넣기 → Run

-- 검증 쿼리:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'consultations' AND column_name IN ('subject', 'description', 'completed_at');
```

**생성 객체**:
- 컬럼: `consultations.subject`, `consultations.description`, `consultations.completed_at`
- 인덱스: `idx_consultations_status`, `idx_consultations_completed_at`

---

#### ③ `20251021000000_stats_views.sql` - 통계 뷰
**목적**: 대시보드 통계 위젯을 위한 데이터베이스 뷰 생성

**적용 방법**:
```sql
-- Supabase Dashboard → SQL Editor → New Query
-- 파일 내용 전체 복사 붙여넣기 → Run

-- 검증 쿼리:
SELECT * FROM report_stats LIMIT 5;
SELECT * FROM consultation_stats LIMIT 5;
SELECT * FROM monthly_trends LIMIT 5;
```

**생성 객체**:
- 뷰: `report_stats`, `consultation_stats`, `monthly_trends`
- 인덱스: `idx_reports_created_at`, `idx_reports_status`, `idx_reports_type`, `idx_reports_region`

---

#### ④ `20251022000000_admin_tables.sql` - 관리자 시스템
**목적**: 관리자 기능 (협회 관리, 사용자 승인, 감사 로그)

**적용 방법**:
```sql
-- Supabase Dashboard → SQL Editor → New Query
-- 파일 내용 전체 복사 붙여넣기 → Run

-- 검증 쿼리:
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('associations', 'association_members', 'user_approvals', 'audit_logs');
```

**생성 객체**:
- 테이블: `associations` (수정), `association_members`, `user_approvals`, `audit_logs`
- 트리거: `update_associations_updated_at`, `update_user_approvals_updated_at`

---

#### ⑤ `20251022000001_notifications.sql` - 알림 시스템
**목적**: 이메일/실시간/SMS 알림 시스템

**적용 방법**:
```sql
-- Supabase Dashboard → SQL Editor → New Query
-- 파일 내용 전체 복사 붙여넣기 → Run

-- 검증 쿼리:
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('notifications', 'notification_settings', 'email_templates');

-- 이메일 템플릿 확인:
SELECT template_key, subject FROM email_templates;
```

**생성 객체**:
- 테이블: `notifications`, `notification_settings`, `email_templates`
- 함수: `cleanup_old_notifications()` (30일 이상 알림 자동 삭제)
- 시드 데이터: 4개 이메일 템플릿 (`counselor_assigned`, `new_message`, `status_changed`, `reminder`)

**RLS 정책**:
- 사용자는 본인 알림만 읽기/수정 가능
- 이메일 템플릿은 모든 인증 사용자 읽기 가능

---

#### ⑥ `20251023000000_search_system.sql` - 검색 시스템
**목적**: 통합 전문 검색 (신고, 상담, 게시글)

**적용 방법**:
```sql
-- Supabase Dashboard → SQL Editor → New Query
-- 파일 내용 전체 복사 붙여넣기 → Run

-- 검증 쿼리:
-- 1. search_vector 컬럼 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('reports', 'consultations', 'posts') AND column_name = 'search_vector';

-- 2. GIN 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE indexname LIKE '%search_vector%';

-- 3. 통합 검색 함수 테스트
SELECT * FROM search_unified('테스트', NULL, 10, 0);
```

**생성 객체**:
- 컬럼: `reports.search_vector`, `consultations.search_vector`, `posts.search_vector` (tsvector, STORED)
- 인덱스: GIN 인덱스 3개 (빠른 전문 검색)
- 테이블: `search_logs` (검색 분석), `search_history` (사용자 검색 기록, max 10), `popular_searches` (인기 검색어)
- 함수: `search_unified()` (통합 검색), `enforce_search_history_limit()` (FIFO)

**성능 목표**: 응답 시간 <500ms (GIN 인덱스)

---

### 1.2 마이그레이션 적용 확인 체크리스트

모든 마이그레이션 적용 후 아래 체크리스트를 확인하세요:

```sql
-- ✅ 1. 모든 테이블 존재 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ✅ 2. 모든 뷰 존재 확인
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';

-- ✅ 3. 모든 함수 존재 확인
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ✅ 4. RLS 활성화 확인
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- ✅ 5. 인덱스 확인
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 2. 환경 변수 설정 (.env.local)

### 2.1 필수 환경 변수

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```bash
# ============================================================================
# Resend API (알림 시스템 이메일 발송)
# ============================================================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 발급 방법:
# 1. https://resend.com/login 접속
# 2. Settings → API Keys → Create API Key
# 3. 키 복사하여 위에 붙여넣기

# ============================================================================
# Supabase (기존 설정 유지)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# JWT Secret (기존 설정 유지)
# ============================================================================
JWT_SECRET=your-super-secret-key-change-this-in-production
```

### 2.2 선택 환경 변수 (향후 확장용)

```bash
# ============================================================================
# SMS 알림 (향후 구현 시 추가)
# ============================================================================
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_AUTH_TOKEN=your-auth-token
# TWILIO_PHONE_NUMBER=+821012345678

# ============================================================================
# 알림 시스템 설정 (기본값 사용 가능)
# ============================================================================
# NOTIFICATION_RETRY_MAX=3
# NOTIFICATION_CLEANUP_DAYS=30
```

---

## 3. 로컬 개발 서버 재시작

환경 변수 변경 후 Next.js 개발 서버를 재시작하세요:

```bash
# 1. 현재 실행 중인 dev 서버 종료 (Ctrl+C)
# 2. 개발 서버 재시작
npm run dev

# 또는 pnpm 사용 시
pnpm dev
```

---

## 4. 기능 테스트

### 4.1 통계 뷰 테스트
```bash
npm test -- tests/lib/stats/database-views.test.ts
```

### 4.2 관리자 기능 테스트
```bash
npm test -- tests/features/admin/
```

### 4.3 알림 시스템 테스트
```bash
npm test -- tests/features/notification/
```

### 4.4 검색 시스템 테스트
```bash
npm test -- tests/features/search/
```

---

## 5. 프로덕션 배포 전 체크리스트

- [ ] 모든 마이그레이션 적용 완료
- [ ] `.env.local` 환경 변수 설정 완료
- [ ] `RESEND_API_KEY` 발급 및 설정 완료
- [ ] 로컬 개발 서버 정상 동작 확인
- [ ] 모든 단위 테스트 통과 (`npm test`)
- [ ] 통합 테스트 통과 (`npm run test:e2e`)
- [ ] Supabase RLS 정책 활성화 확인
- [ ] Supabase 인덱스 생성 확인

---

## 6. 다음 단계 (개발 계획)

### 즉시 진행 가능
✅ DB 마이그레이션 적용 완료
✅ 환경 변수 설정 완료

### 다음 개발 작업
1. **Admin UI 구현** (TAG-011~013)
   - 협회 관리 페이지
   - 사용자 승인 페이지
   - 감사 로그 뷰어

2. **Notification UI 구현** (TAG-009~010)
   - 알림 목록/상세 페이지
   - 알림 설정 페이지
   - 실시간 알림 배지

3. **Search UI 구현** (TAG-014~015)
   - 통합 검색 페이지
   - 검색 자동완성
   - 인기 검색어

4. **E2E 테스트 확장**
   - 관리자 워크플로우 테스트
   - 알림 발송 시나리오 테스트
   - 검색 정확도 테스트

5. **성능 최적화**
   - 검색 응답 시간 모니터링
   - 통계 뷰 캐싱 전략
   - 알림 배치 발송

---

## 7. 문제 해결

### 마이그레이션 실패 시
```sql
-- 1. 롤백: Supabase Dashboard → SQL Editor
DROP VIEW IF EXISTS report_stats CASCADE;
DROP VIEW IF EXISTS consultation_stats CASCADE;
DROP VIEW IF EXISTS monthly_trends CASCADE;
DROP TABLE IF EXISTS association_members CASCADE;
DROP TABLE IF EXISTS user_approvals CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS search_logs CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;
DROP TABLE IF EXISTS popular_searches CASCADE;

-- 2. 다시 처음부터 마이그레이션 적용
```

### 환경 변수 인식 안 될 때
```bash
# 1. Next.js 캐시 삭제
rm -rf .next

# 2. node_modules 재설치 (선택)
rm -rf node_modules
npm install

# 3. 개발 서버 재시작
npm run dev
```

---

**작성자**: Alfred (MoAI SuperAgent)
**최종 업데이트**: 2025-10-22
