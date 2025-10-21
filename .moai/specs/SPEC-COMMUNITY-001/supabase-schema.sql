-- @CODE:COMMUNITY-001:INFRA | SPEC: spec.md
-- COMMUNITY-001 Supabase 데이터베이스 스키마
-- 생성일: 2025-10-21
-- 작성자: @Alfred

-- ============================================
-- 1. posts (게시글)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('case', 'qa', 'info')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 100),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 5000),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_nickname TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  is_blinded BOOLEAN NOT NULL DEFAULT FALSE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_popular ON posts(is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- RLS (Row Level Security) 정책
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게시글 조회 가능 (블라인드 제외)
CREATE POLICY "Anyone can view non-blinded posts"
  ON posts FOR SELECT
  USING (is_blinded = FALSE OR auth.uid() = author_id);

-- 인증된 사용자만 게시글 작성 가능
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- 작성자만 자신의 게시글 수정 가능
CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 작성자만 자신의 게시글 삭제 가능
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 2. comments (댓글)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_nickname TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC);

-- RLS 정책
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (TRUE);

-- 인증된 사용자만 댓글 작성 가능
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = author_id);

-- 작성자만 자신의 댓글 수정 가능
CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 작성자만 자신의 댓글 삭제 가능
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 3. post_reports (게시글 신고)
-- ============================================
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- 같은 사용자가 같은 게시글을 중복 신고할 수 없음 (C-007)
  UNIQUE(post_id, reporter_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_reports_post_id ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status ON post_reports(status) WHERE status = 'pending';

-- RLS 정책
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- 신고자만 자신의 신고 내역 조회 가능
CREATE POLICY "Users can view their own reports"
  ON post_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- 인증된 사용자만 신고 작성 가능
CREATE POLICY "Authenticated users can create reports"
  ON post_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);

-- ============================================
-- 4. post_drafts (임시 저장)
-- ============================================
CREATE TABLE IF NOT EXISTS post_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('case', 'qa', 'info')),
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 사용자당 카테고리별로 1개의 임시 저장만 허용
  UNIQUE(author_id, category)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_post_drafts_author_id ON post_drafts(author_id);

-- RLS 정책
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 임시 저장만 조회 가능
CREATE POLICY "Users can view their own drafts"
  ON post_drafts FOR SELECT
  USING (auth.uid() = author_id);

-- 사용자는 자신의 임시 저장만 작성 가능
CREATE POLICY "Users can create their own drafts"
  ON post_drafts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 사용자는 자신의 임시 저장만 수정 가능
CREATE POLICY "Users can update their own drafts"
  ON post_drafts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 사용자는 자신의 임시 저장만 삭제 가능
CREATE POLICY "Users can delete their own drafts"
  ON post_drafts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- 5. 트리거 함수 (updated_at 자동 업데이트)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- posts 테이블 트리거
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- comments 테이블 트리거
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- post_drafts 테이블 트리거
CREATE TRIGGER update_post_drafts_updated_at
  BEFORE UPDATE ON post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 자동 블라인드 처리 트리거 (신고 3회 이상)
-- ============================================
CREATE OR REPLACE FUNCTION auto_blind_post_on_reports()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- 해당 게시글의 pending 신고 횟수 카운트
  SELECT COUNT(*) INTO report_count
  FROM post_reports
  WHERE post_id = NEW.post_id AND status = 'pending';

  -- 신고 횟수가 3회 이상이면 자동 블라인드 처리 (ER-003)
  IF report_count >= 3 THEN
    UPDATE posts
    SET is_blinded = TRUE
    WHERE id = NEW.post_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_blind_on_report
  AFTER INSERT ON post_reports
  FOR EACH ROW
  EXECUTE FUNCTION auto_blind_post_on_reports();

-- ============================================
-- 7. 인기 게시글 배지 트리거 (조회수 100회 이상)
-- ============================================
CREATE OR REPLACE FUNCTION update_popular_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- 조회수가 100회 이상이면 인기 게시글 배지 활성화 (ER-004)
  IF NEW.view_count >= 100 THEN
    NEW.is_popular = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_popular_badge_on_view_count
  BEFORE UPDATE OF view_count ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_popular_badge();

-- ============================================
-- 스키마 생성 완료
-- ============================================
-- 다음 단계:
-- 1. Supabase Dashboard → SQL Editor에서 이 스크립트 실행
-- 2. 실행 완료 후 /alfred:2-run COMMUNITY-001 계속 진행
