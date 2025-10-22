# 📋 Supabase 스키마 검증 체크리스트

> **작성일**: 2025-10-21
> **대상**: CONSULT-001 (실시간 상담), DASHBOARD-001 (역할별 대시보드)
> **목적**: 기존 Supabase 테이블 확인 및 누락 구성요소 추천

---

## ✅ 필수 테이블 구조

### 1. `consultations` 테이블

#### 필수 컬럼
```sql
- [ ] id: UUID (Primary Key, Default: uuid_generate_v4())
- [ ] match_id: UUID (Foreign Key → matches.id, NOT NULL)
- [ ] teacher_id: UUID (Foreign Key → users.id, NOT NULL)
- [ ] lawyer_id: UUID (Foreign Key → users.id, NOT NULL)
- [ ] status: TEXT (CHECK: 'active'|'completed'|'cancelled', Default: 'active')
- [ ] started_at: TIMESTAMPTZ (Default: NOW())
- [ ] ended_at: TIMESTAMPTZ (Nullable)
- [ ] created_at: TIMESTAMPTZ (Default: NOW())
- [ ] updated_at: TIMESTAMPTZ (Default: NOW())
```

#### 필수 인덱스
```sql
- [ ] idx_consultations_match: ON consultations(match_id)
- [ ] idx_consultations_teacher: ON consultations(teacher_id)
- [ ] idx_consultations_lawyer: ON consultations(lawyer_id)
- [ ] idx_consultations_status: ON consultations(status) WHERE status = 'active'
```

#### 필수 제약조건 (Constraints)
```sql
- [ ] status CHECK: status IN ('active', 'completed', 'cancelled')
- [ ] match_id Foreign Key: REFERENCES matches(id)
- [ ] teacher_id Foreign Key: REFERENCES users(id)
- [ ] lawyer_id Foreign Key: REFERENCES users(id)
```

---

### 2. `messages` 테이블

#### 필수 컬럼
```sql
- [ ] id: UUID (Primary Key, Default: uuid_generate_v4())
- [ ] consultation_id: UUID (Foreign Key → consultations.id ON DELETE CASCADE, NOT NULL)
- [ ] sender_id: UUID (Foreign Key → users.id, NOT NULL)
- [ ] content: TEXT (NOT NULL, CHECK: length(content) > 0 AND length(content) <= 5000)
- [ ] attachments: JSONB (Default: '[]'::jsonb)
- [ ] is_read: BOOLEAN (Default: FALSE)
- [ ] read_at: TIMESTAMPTZ (Nullable)
- [ ] retry_count: INTEGER (Default: 0, CHECK: retry_count >= 0 AND retry_count <= 3)
- [ ] created_at: TIMESTAMPTZ (Default: NOW())
- [ ] updated_at: TIMESTAMPTZ (Default: NOW())
```

#### 필수 인덱스
```sql
- [ ] idx_messages_consultation: ON messages(consultation_id, created_at DESC)
- [ ] idx_messages_sender: ON messages(sender_id)
- [ ] idx_messages_unread: ON messages(consultation_id) WHERE is_read = FALSE
```

#### 필수 제약조건 (Constraints)
```sql
- [ ] content CHECK: length(content) > 0 AND length(content) <= 5000
- [ ] retry_count CHECK: retry_count >= 0 AND retry_count <= 3
- [ ] consultation_id Foreign Key: REFERENCES consultations(id) ON DELETE CASCADE
- [ ] sender_id Foreign Key: REFERENCES users(id)
```

---

## ✅ Supabase Realtime 설정

### Realtime Publication
```sql
-- consultations 테이블 Realtime 활성화
- [ ] ALTER PUBLICATION supabase_realtime ADD TABLE consultations;

-- messages 테이블 Realtime 활성화
- [ ] ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**확인 방법**:
1. Supabase Dashboard → Database → Replication
2. `consultations`, `messages` 테이블의 "Realtime" 상태 확인
3. ✅ **Enable** 상태여야 함

---

## ✅ Row Level Security (RLS) 정책

### `consultations` 테이블 RLS

#### RLS 활성화
```sql
- [ ] ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
```

#### SELECT 정책
```sql
- [ ] CREATE POLICY "consultations_select_policy" ON consultations
  FOR SELECT
  USING (
    auth.uid() = teacher_id OR
    auth.uid() = lawyer_id
  );
```

#### UPDATE 정책
```sql
- [ ] CREATE POLICY "consultations_update_policy" ON consultations
  FOR UPDATE
  USING (
    auth.uid() = teacher_id OR
    auth.uid() = lawyer_id
  );
```

---

### `messages` 테이블 RLS

#### RLS 활성화
```sql
- [ ] ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

#### SELECT 정책
```sql
- [ ] CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = messages.consultation_id
      AND (consultations.teacher_id = auth.uid() OR consultations.lawyer_id = auth.uid())
    )
  );
```

#### INSERT 정책
```sql
- [ ] CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = messages.consultation_id
      AND (consultations.teacher_id = auth.uid() OR consultations.lawyer_id = auth.uid())
    )
    AND sender_id = auth.uid()
  );
```

#### UPDATE 정책 (읽음 상태 업데이트)
```sql
- [ ] CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = messages.consultation_id
      AND (consultations.teacher_id = auth.uid() OR consultations.lawyer_id = auth.uid())
    )
  );
```

---

## ✅ Trigger Functions (자동 업데이트)

### `updated_at` 자동 업데이트 함수
```sql
- [ ] CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### `consultations` 테이블 트리거
```sql
- [ ] CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### `messages` 테이블 트리거
```sql
- [ ] CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## ✅ Supabase Storage 설정

### Storage Bucket 생성

#### 1. `consultation-files` 버킷 생성
- [ ] Supabase Dashboard → Storage → Create a new bucket
- [ ] 버킷 이름: `consultation-files`
- [ ] Public 설정: ❌ (비공개)
- [ ] Create bucket 클릭

#### 2. Storage RLS 정책 설정

**업로드 정책** (인증된 사용자만 업로드):
```sql
- [ ] CREATE POLICY "authenticated_users_upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'consultation-files');
```

**다운로드 정책** (인증된 사용자만 다운로드):
```sql
- [ ] CREATE POLICY "authenticated_users_download" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'consultation-files');
```

**삭제 정책** (본인이 업로드한 파일만 삭제):
```sql
- [ ] CREATE POLICY "users_delete_own_files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'consultation-files' AND
  owner = auth.uid()
);
```

---

## ✅ 데이터 검증 쿼리

### 테이블 존재 확인
```sql
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('consultations', 'messages')
ORDER BY tablename;
```

**예상 결과**:
```
 schemaname | tablename     | tableowner
------------+---------------+-----------
 public     | consultations | postgres
 public     | messages      | postgres
```

---

### 컬럼 구조 확인
```sql
-- consultations 테이블 컬럼
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'consultations'
ORDER BY ordinal_position;

-- messages 테이블 컬럼
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
```

---

### 인덱스 확인
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('consultations', 'messages')
ORDER BY tablename, indexname;
```

**예상 인덱스 목록**:
- `idx_consultations_match`
- `idx_consultations_teacher`
- `idx_consultations_lawyer`
- `idx_consultations_status`
- `idx_messages_consultation`
- `idx_messages_sender`
- `idx_messages_unread`

---

### RLS 정책 확인
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('consultations', 'messages')
ORDER BY tablename, policyname;
```

**예상 정책 목록**:
- `consultations_select_policy` (SELECT)
- `consultations_update_policy` (UPDATE)
- `messages_select_policy` (SELECT)
- `messages_insert_policy` (INSERT)
- `messages_update_policy` (UPDATE)

---

### Trigger 확인
```sql
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('consultations', 'messages')
ORDER BY event_object_table, trigger_name;
```

**예상 트리거 목록**:
- `update_consultations_updated_at` (BEFORE UPDATE)
- `update_messages_updated_at` (BEFORE UPDATE)

---

### Realtime Publication 확인
```sql
-- Realtime Publication에 포함된 테이블 확인
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('consultations', 'messages');
```

**예상 결과**:
```
 schemaname | tablename
------------+---------------
 public     | consultations
 public     | messages
```

---

### Storage Bucket 확인
```sql
-- Storage 버킷 존재 확인
SELECT id, name, public, created_at
FROM storage.buckets
WHERE name = 'consultation-files';
```

**예상 결과**:
```
 id                                   | name                | public | created_at
--------------------------------------+---------------------+--------+---------------------------
 <uuid>                               | consultation-files  | false  | 2025-10-21 12:00:00+00
```

---

## 🔍 추가 권장 사항

### 1. 성능 최적화

#### Partial Index 추가 (선택사항)
```sql
-- 활성 상담만 필터링하는 경우 성능 향상
CREATE INDEX IF NOT EXISTS idx_consultations_active_teacher
ON consultations(teacher_id, started_at DESC)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_consultations_active_lawyer
ON consultations(lawyer_id, started_at DESC)
WHERE status = 'active';
```

#### Composite Index 추가 (선택사항)
```sql
-- 메시지 조회 시 sender_id + created_at 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_sender_created
ON messages(sender_id, created_at DESC);
```

---

### 2. 데이터 무결성

#### Soft Delete 지원 (선택사항)
```sql
-- consultations 테이블에 deleted_at 추가
ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- messages 테이블에 deleted_at 추가
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Soft Delete용 인덱스
CREATE INDEX IF NOT EXISTS idx_consultations_not_deleted
ON consultations(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_not_deleted
ON messages(id) WHERE deleted_at IS NULL;
```

---

### 3. 감사 로깅 (선택사항)

#### Audit Log 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS message_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id),
  action TEXT NOT NULL, -- 'insert', 'update', 'delete'
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_log_message ON message_audit_log(message_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON message_audit_log(changed_at DESC);
```

---

### 4. 통계 및 분석 (선택사항)

#### Materialized View (대시보드 성능 향상)
```sql
-- 교사별 상담 통계
CREATE MATERIALIZED VIEW IF NOT EXISTS teacher_consultation_stats AS
SELECT
  teacher_id,
  COUNT(*) AS total_consultations,
  COUNT(*) FILTER (WHERE status = 'active') AS active_consultations,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_consultations,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 3600) AS avg_duration_hours
FROM consultations
GROUP BY teacher_id;

-- 인덱스
CREATE UNIQUE INDEX ON teacher_consultation_stats(teacher_id);

-- 자동 갱신 (5분마다)
-- Note: Supabase에서는 pg_cron 확장 필요
```

---

## 📊 검증 실행 순서

### 1단계: 필수 구성요소 확인
```bash
# Supabase Dashboard → SQL Editor에서 실행
1. 테이블 존재 확인 쿼리
2. 컬럼 구조 확인 쿼리
3. 인덱스 확인 쿼리
4. RLS 정책 확인 쿼리
5. Trigger 확인 쿼리
6. Realtime Publication 확인 쿼리
7. Storage Bucket 확인 쿼리
```

### 2단계: 누락된 구성요소 추가
```bash
# 001_create_consultation_tables.sql 참조
# 누락된 인덱스, RLS 정책, 트리거 등을 순차적으로 실행
```

### 3단계: E2E 테스트 실행
```bash
# 로컬 환경에서 테스트
npm test tests/e2e/consultation-integration.test.ts
npm test tests/e2e/dashboard-integration.test.ts
```

### 4단계: 브라우저 수동 테스트
```bash
# docs/integration-testing-guide.md 참조
# Chrome DevTools로 WebSocket 연결, 성능 측정
```

---

## 🐛 트러블슈팅

### 문제 1: RLS 정책 누락으로 인한 403 에러
**증상**: `Error: new row violates row-level security policy`

**해결**:
```sql
-- RLS 정책 재생성
-- consultations_insert_policy 추가 (누락 가능성)
CREATE POLICY "consultations_insert_policy" ON consultations
  FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id OR
    auth.uid() = lawyer_id
  );
```

---

### 문제 2: Realtime 메시지 수신 안됨
**증상**: WebSocket 연결은 되지만 메시지가 수신되지 않음

**해결**:
```bash
1. Supabase Dashboard → Database → Replication
2. consultations, messages 테이블 "Enable" 클릭
3. Publication 설정 확인
4. 브라우저 새로고침 후 재시도
```

---

### 문제 3: Storage 파일 업로드 실패
**증상**: `Error: new row violates policy`

**해결**:
```sql
-- Storage RLS 정책 확인 및 재생성
-- authenticated_users_upload 정책 추가
```

---

## ✅ 최종 체크리스트

### 데이터베이스
- [ ] `consultations` 테이블 존재 및 컬럼 구조 확인
- [ ] `messages` 테이블 존재 및 컬럼 구조 확인
- [ ] 모든 인덱스 생성 완료 (7개)
- [ ] 모든 RLS 정책 생성 완료 (5개)
- [ ] 모든 Trigger 생성 완료 (2개)

### Realtime
- [ ] `consultations` Realtime Publication 활성화
- [ ] `messages` Realtime Publication 활성화
- [ ] WebSocket 연결 테스트 (Chrome DevTools)

### Storage
- [ ] `consultation-files` 버킷 생성
- [ ] Storage RLS 정책 생성 (3개)
- [ ] 파일 업로드 테스트 (5MB 제한)

### 테스트
- [ ] E2E 통합 테스트 통과 (consultation-integration.test.ts)
- [ ] E2E 대시보드 테스트 통과 (dashboard-integration.test.ts)
- [ ] 브라우저 수동 테스트 완료 (integration-testing-guide.md)

---

**작성자**: @Alfred
**최종 업데이트**: 2025-10-21
**참조 문서**:
- `supabase/migrations/001_create_consultation_tables.sql`
- `docs/integration-testing-guide.md`
- `tests/e2e/consultation-integration.test.ts`
- `tests/e2e/dashboard-integration.test.ts`
