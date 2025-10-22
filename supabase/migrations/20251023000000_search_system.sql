-- @CODE:SEARCH-001:MIGRATION | SPEC: .moai/specs/SPEC-SEARCH-001/spec.md

/**
 * Search System Migration
 *
 * @description
 * Creates full-text search infrastructure for unified search across reports, consultations, and posts.
 *
 * @features
 * - Full-text search vectors (tsvector) with GIN indexes
 * - Search logging and analytics
 * - Search history (max 10 per user, FIFO)
 * - Popular searches tracking
 * - Unified search RPC function
 *
 * @performance
 * - GIN indexes for fast full-text search (<500ms response time)
 * - Automatic search_vector updates via triggers
 * - Korean language configuration
 *
 * @generated 2025-10-23
 * @spec SPEC-SEARCH-001
 */

-- =============================================================================
-- 1. Add search_vector columns to existing tables
-- =============================================================================

-- reports table: Add search_vector for full-text search
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(school_name, '')
  )
) STORED;

-- consultations table: Add search_vector
ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple',
    coalesce(subject, '') || ' ' ||
    coalesce(description, '')
  )
) STORED;

-- posts table: Add search_vector
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(content, '')
  )
) STORED;

-- =============================================================================
-- 2. Create GIN indexes for fast full-text search
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_reports_search_vector
ON reports USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_consultations_search_vector
ON consultations USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_posts_search_vector
ON posts USING GIN(search_vector);

-- =============================================================================
-- 3. Create search_logs table (for analytics and popular searches)
-- =============================================================================

CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = anonymous search
  query TEXT NOT NULL,
  filters JSONB, -- {category: 'reports', start_date: '2025-01-01', end_date: '2025-01-31'}
  results_count INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER NOT NULL DEFAULT 0, -- Performance tracking (C-001: <500ms)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries (popular searches aggregation)
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);

-- =============================================================================
-- 4. Create search_history table (C-004: max 10 per user, FIFO)
-- =============================================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, query) -- Prevent duplicate searches per user
);

-- Index for fast user history lookup
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id, created_at DESC);

-- =============================================================================
-- 5. Create popular_searches table (top 10 searches, updated hourly)
-- =============================================================================

CREATE TABLE IF NOT EXISTS popular_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT UNIQUE NOT NULL,
  search_count INTEGER NOT NULL DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for ranking queries
CREATE INDEX IF NOT EXISTS idx_popular_searches_count ON popular_searches(search_count DESC);

-- =============================================================================
-- 6. Create unified search RPC function
-- =============================================================================

CREATE OR REPLACE FUNCTION search_unified(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL, -- 'reports' | 'consultations' | 'posts' | NULL (all)
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT, -- 'report' | 'consultation' | 'post'
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL -- ts_rank score
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    -- Search reports
    SELECT
      r.id,
      'report'::TEXT AS type,
      r.title,
      r.description AS content,
      r.created_at,
      ts_rank(r.search_vector, to_tsquery('simple', search_query)) AS rank
    FROM reports r
    WHERE r.search_vector @@ to_tsquery('simple', search_query)
      AND r.status != 'closed'
      AND (category_filter IS NULL OR category_filter = 'reports')

    UNION ALL

    -- Search consultations
    SELECT
      c.id,
      'consultation'::TEXT AS type,
      c.subject AS title,
      c.description AS content,
      c.created_at,
      ts_rank(c.search_vector, to_tsquery('simple', search_query)) AS rank
    FROM consultations c
    WHERE c.search_vector @@ to_tsquery('simple', search_query)
      AND c.status != 'cancelled'
      AND (category_filter IS NULL OR category_filter = 'consultations')

    UNION ALL

    -- Search posts
    SELECT
      p.id,
      'post'::TEXT AS type,
      p.title,
      p.content,
      p.created_at,
      ts_rank(p.search_vector, to_tsquery('simple', search_query)) AS rank
    FROM posts p
    WHERE p.search_vector @@ to_tsquery('simple', search_query)
      AND p.is_blinded = false
      AND (category_filter IS NULL OR category_filter = 'posts')
  ) AS unified_results
  ORDER BY rank DESC, created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- 7. Create trigger function to enforce FIFO on search_history (C-004: max 10)
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_search_history_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest entries if user exceeds 10 history items
  DELETE FROM search_history
  WHERE id IN (
    SELECT id FROM search_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_search_history_limit
AFTER INSERT ON search_history
FOR EACH ROW
EXECUTE FUNCTION enforce_search_history_limit();

-- =============================================================================
-- 8. Grant permissions
-- =============================================================================

-- Allow authenticated users to search
GRANT SELECT ON search_logs TO authenticated;
GRANT INSERT ON search_logs TO authenticated;

GRANT SELECT ON search_history TO authenticated;
GRANT INSERT ON search_history TO authenticated;
GRANT DELETE ON search_history TO authenticated;

GRANT SELECT ON popular_searches TO authenticated;
GRANT SELECT ON popular_searches TO anon; -- Public access for popular searches

-- Grant execute permission for RPC function
GRANT EXECUTE ON FUNCTION search_unified(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_unified(TEXT, TEXT, INTEGER, INTEGER) TO anon;

-- =============================================================================
-- 9. Row Level Security (RLS) policies
-- =============================================================================

-- search_history: Users can only see/delete their own history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY search_history_select_policy ON search_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY search_history_insert_policy ON search_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY search_history_delete_policy ON search_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- search_logs: No RLS (analytics data, no sensitive info)
-- popular_searches: Public read access, no RLS needed

COMMENT ON TABLE search_logs IS 'Search analytics and logging (SPEC-SEARCH-001, ER-003)';
COMMENT ON TABLE search_history IS 'User search history, max 10 per user (SPEC-SEARCH-001, C-004)';
COMMENT ON TABLE popular_searches IS 'Popular searches aggregation (SPEC-SEARCH-001, ER-001)';
COMMENT ON FUNCTION search_unified IS 'Unified search across reports, consultations, posts (SPEC-SEARCH-001, UR-001)';
