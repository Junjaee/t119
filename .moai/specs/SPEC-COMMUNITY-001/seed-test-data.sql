-- @TEST:COMMUNITY-001 | SPEC: SPEC-COMMUNITY-001.md
-- Test Data Seed for COMMUNITY-001 E2E Testing
--
-- 이 파일은 E2E 테스트를 위한 샘플 데이터를 생성합니다.
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- ⚠️ 중요: RLS 정책 임시 비활성화 (테스트 데이터 삽입용)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_drafts DISABLE ROW LEVEL SECURITY;

-- 외래키 제약조건 임시 제거 (테스트 데이터 삽입용)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE post_reports DROP CONSTRAINT IF EXISTS post_reports_reporter_id_fkey;
ALTER TABLE post_reports DROP CONSTRAINT IF EXISTS post_reports_post_id_fkey;
ALTER TABLE post_drafts DROP CONSTRAINT IF EXISTS post_drafts_author_id_fkey;

-- 기존 테스트 데이터 정리 (선택사항)
DELETE FROM post_reports WHERE post_id IN (SELECT id FROM posts WHERE title LIKE 'E2E 테스트%');
DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE title LIKE 'E2E 테스트%');
DELETE FROM post_drafts WHERE title LIKE 'E2E 테스트%';
DELETE FROM posts WHERE title LIKE 'E2E 테스트%';

-- 0. 테스트용 더미 사용자 UUID 생성 (고정 UUID 사용)
-- 실제 auth.users에는 없지만 테스트용으로 사용
DO $$
DECLARE
  test_user_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  -- 테스트용 author_id로 사용할 UUID
END $$;

-- 1. 샘플 게시글 생성 (10개, 테스트용 author_id 사용)
INSERT INTO posts (author_id, title, content, category, anonymous_nickname, is_popular, view_count, image_url) VALUES
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 학교 폭력 사례 공유', '학교 폭력 사건을 겪었습니다. 어떻게 대처해야 할까요? 학생과 학부모의 반응이 걱정됩니다.', 'case', '익명의 호랑이', false, 15, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 학부모 상담 Q&A', '학부모와의 상담 시 주의사항이 있을까요? 특히 민감한 문제에 대해 어떻게 대화해야 할지 조언 부탁드립니다.', 'qa', '익명의 토끼', false, 8, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 교육법 정보 공유', '최근 개정된 교육법에 대한 정보입니다. 교사의 권리와 의무가 명확히 규정되어 있으니 참고하시면 좋을 것 같습니다.', 'info', '익명의 사자', true, 120, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 인기 게시글 - 학생 인권', '학생 인권 보호에 대한 사례를 공유합니다. 최근 학교에서 발생한 사건을 바탕으로 작성한 글입니다.', 'case', '익명의 독수리', true, 250, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 일반 게시글 1', '일반적인 교사 권익 보호 사례입니다. 학교 현장에서 겪을 수 있는 다양한 상황에 대한 대응 방법을 정리했습니다.', 'case', '익명의 여우', false, 5, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 일반 게시글 2', 'Q&A 게시글 샘플입니다. 교사로서 겪는 고민과 질문을 자유롭게 나눌 수 있는 공간입니다.', 'qa', '익명의 곰', false, 3, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 일반 게시글 3', '정보 공유 게시글 샘플입니다. 교육 관련 유용한 정보와 자료를 공유하는 게시글입니다.', 'info', '익명의 늑대', false, 10, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 일반 게시글 4', '사례 공유 게시글 샘플입니다. 실제 학교 현장에서 발생한 사례를 바탕으로 작성한 글입니다.', 'case', '익명의 펭귄', false, 7, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 일반 게시글 5', 'Q&A 게시글 샘플입니다. 교육 현장의 다양한 질문과 답변을 나누는 공간입니다.', 'qa', '익명의 고래', false, 12, NULL),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'E2E 테스트: 일반 게시글 6', '정보 공유 게시글 샘플입니다. 최신 교육 정책과 제도에 대한 정보를 공유하는 게시글입니다.', 'info', '익명의 판다', false, 20, NULL);

-- 2. 샘플 댓글 생성 (각 게시글에 2-3개씩)
INSERT INTO comments (author_id, post_id, content, anonymous_nickname)
SELECT
  'a0000000-0000-0000-0000-000000000001'::UUID,
  p.id,
  'E2E 테스트 댓글: 도움이 되는 정보 감사합니다!',
  '익명의 참새'
FROM posts p
WHERE p.title LIKE 'E2E 테스트%'
LIMIT 5;

INSERT INTO comments (author_id, post_id, content, anonymous_nickname)
SELECT
  'a0000000-0000-0000-0000-000000000001'::UUID,
  p.id,
  'E2E 테스트 댓글: 저도 비슷한 경험이 있습니다.',
  '익명의 제비'
FROM posts p
WHERE p.title LIKE 'E2E 테스트%'
ORDER BY p.created_at DESC
LIMIT 5;

INSERT INTO comments (author_id, post_id, content, anonymous_nickname)
SELECT
  'a0000000-0000-0000-0000-000000000001'::UUID,
  p.id,
  'E2E 테스트 댓글: 추가 정보가 필요하시면 말씀해주세요.',
  '익명의 까치'
FROM posts p
WHERE p.title LIKE 'E2E 테스트%'
ORDER BY p.view_count DESC
LIMIT 3;

-- 3. 샘플 임시 저장 데이터 생성
INSERT INTO post_drafts (author_id, category, title, content)
VALUES
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'case', 'E2E 테스트: 임시 저장된 게시글', '이것은 임시 저장된 게시글 내용입니다.'),
  ('a0000000-0000-0000-0000-000000000001'::UUID, 'qa', 'E2E 테스트: 임시 저장 Q&A', '임시 저장된 Q&A 내용입니다.');

-- 4. 샘플 신고 데이터 생성 (특정 게시글에 신고 2개 추가)
INSERT INTO post_reports (reporter_id, post_id, reason)
SELECT
  'a0000000-0000-0000-0000-000000000001'::UUID,
  p.id,
  'E2E 테스트: 부적절한 내용이 포함되어 있습니다.'
FROM posts p
WHERE p.title = 'E2E 테스트: 일반 게시글 1'
LIMIT 1;

INSERT INTO post_reports (reporter_id, post_id, reason)
SELECT
  'a0000000-0000-0000-0000-000000000002'::UUID,
  p.id,
  'E2E 테스트: 스팸 게시글입니다.'
FROM posts p
WHERE p.title = 'E2E 테스트: 일반 게시글 1'
LIMIT 1;

-- 5. 생성된 데이터 확인
SELECT
  'posts' as table_name,
  COUNT(*) as count
FROM posts
WHERE title LIKE 'E2E 테스트%'
UNION ALL
SELECT
  'comments' as table_name,
  COUNT(*) as count
FROM comments
WHERE content LIKE 'E2E 테스트%'
UNION ALL
SELECT
  'post_drafts' as table_name,
  COUNT(*) as count
FROM post_drafts
WHERE title LIKE 'E2E 테스트%'
UNION ALL
SELECT
  'post_reports' as table_name,
  COUNT(*) as count
FROM post_reports
WHERE reason LIKE 'E2E 테스트%';

-- 완료 메시지
SELECT 'E2E 테스트 데이터 생성 완료!' as message;

-- ⚠️ 중요: 테스트 환경에서는 외래키 제약조건을 다시 추가하지 않습니다
-- 이유: 테스트용 UUID가 auth.users 테이블에 실제로 존재하지 않기 때문입니다
-- 프로덕션 환경에서는 아래 주석을 해제하여 제약조건을 복구하세요

-- ALTER TABLE posts
--   ADD CONSTRAINT posts_author_id_fkey
--   FOREIGN KEY (author_id)
--   REFERENCES auth.users(id)
--   ON DELETE CASCADE;
--
-- ALTER TABLE comments
--   ADD CONSTRAINT comments_author_id_fkey
--   FOREIGN KEY (author_id)
--   REFERENCES auth.users(id)
--   ON DELETE CASCADE;
--
-- ALTER TABLE comments
--   ADD CONSTRAINT comments_post_id_fkey
--   FOREIGN KEY (post_id)
--   REFERENCES posts(id)
--   ON DELETE CASCADE;
--
-- ALTER TABLE post_reports
--   ADD CONSTRAINT post_reports_post_id_fkey
--   FOREIGN KEY (post_id)
--   REFERENCES posts(id)
--   ON DELETE CASCADE,
--   ADD CONSTRAINT post_reports_reporter_id_fkey
--   FOREIGN KEY (reporter_id)
--   REFERENCES auth.users(id)
--   ON DELETE CASCADE;
--
-- ALTER TABLE post_drafts
--   ADD CONSTRAINT post_drafts_author_id_fkey
--   FOREIGN KEY (author_id)
--   REFERENCES auth.users(id)
--   ON DELETE CASCADE;

-- 주의: RLS는 테스트 환경에서 비활성화 상태를 유지합니다
-- 프로덕션에서는 아래 주석을 해제하여 RLS를 다시 활성화하세요
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;
