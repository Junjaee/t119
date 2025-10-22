-- Migration: Add missing columns to reports table for stats views
-- Required before: 20251021000000_stats_views.sql
-- Created: 2025-10-22

-- Add missing columns to reports table
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS school_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN reports.type IS 'Report type classification for statistics';
COMMENT ON COLUMN reports.region IS 'Geographic region for regional statistics';
COMMENT ON COLUMN reports.school_level IS 'School level (elementary, middle, high) for statistics';
COMMENT ON COLUMN reports.school_name IS 'School name for search and identification';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_region ON reports(region);
CREATE INDEX IF NOT EXISTS idx_reports_school_level ON reports(school_level);
