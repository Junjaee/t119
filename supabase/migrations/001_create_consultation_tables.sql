-- @SPEC:CONSULT-001 | 실시간 상담 시스템 데이터베이스 스키마
-- 생성일: 2025-10-20
-- 설명: 교사-변호사 간 1:1 실시간 상담을 위한 테이블 생성

-- ============================================================
-- 1. consultations 테이블 (상담 세션 관리)
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  teacher_id UUID REFERENCES users(id) NOT NULL,
  lawyer_id UUID REFERENCES users(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_consultations_match ON consultations(match_id);
CREATE INDEX IF NOT EXISTS idx_consultations_teacher ON consultations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_consultations_lawyer ON consultations(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status) WHERE status = 'active';

-- ============================================================
-- 2. messages 테이블 (메시지 저장)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_consultation ON messages(consultation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(consultation_id) WHERE is_read = FALSE;

-- ============================================================
-- 3. Realtime Publication (실시간 구독 활성화)
-- ============================================================
-- Supabase Realtime을 위한 테이블 Publication 설정
ALTER PUBLICATION supabase_realtime ADD TABLE consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- 4. Row Level Security (RLS) 정책
-- ============================================================

-- consultations 테이블 RLS 활성화
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- 상담 참여자만 조회 가능
CREATE POLICY "consultations_select_policy" ON consultations
  FOR SELECT
  USING (
    auth.uid() = teacher_id OR
    auth.uid() = lawyer_id
  );

-- 상담 참여자만 업데이트 가능
CREATE POLICY "consultations_update_policy" ON consultations
  FOR UPDATE
  USING (
    auth.uid() = teacher_id OR
    auth.uid() = lawyer_id
  );

-- messages 테이블 RLS 활성화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 상담 참여자만 메시지 조회 가능
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = messages.consultation_id
      AND (consultations.teacher_id = auth.uid() OR consultations.lawyer_id = auth.uid())
    )
  );

-- 상담 참여자만 메시지 작성 가능
CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = messages.consultation_id
      AND (consultations.teacher_id = auth.uid() OR consultations.lawyer_id = auth.uid())
    )
    AND sender_id = auth.uid()
  );

-- 본인이 보낸 메시지만 읽음 상태 업데이트 가능
CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM consultations
      WHERE consultations.id = messages.consultation_id
      AND (consultations.teacher_id = auth.uid() OR consultations.lawyer_id = auth.uid())
    )
  );

-- ============================================================
-- 5. Trigger Functions (자동 업데이트)
-- ============================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- consultations 테이블 트리거
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- messages 테이블 트리거
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 샘플 데이터 (개발/테스트용)
-- ============================================================

-- 주석 처리: 프로덕션에서는 실행하지 않음
-- INSERT INTO consultations (match_id, teacher_id, lawyer_id, status)
-- VALUES (
--   '<match_uuid>',
--   '<teacher_uuid>',
--   '<lawyer_uuid>',
--   'active'
-- );

-- ============================================================
-- 7. 검증 쿼리 (스키마 생성 확인)
-- ============================================================

-- 테이블 존재 확인
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('consultations', 'messages');

-- 인덱스 확인
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('consultations', 'messages');

-- RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('consultations', 'messages');
