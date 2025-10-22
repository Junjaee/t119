-- Migration: Add missing columns to consultations table for search
-- Required before: 20251023000000_search_system.sql
-- Created: 2025-10-22

-- Add missing columns to consultations table
ALTER TABLE consultations
ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN consultations.subject IS 'Consultation subject/title for search';
COMMENT ON COLUMN consultations.description IS 'Detailed consultation description for search';
COMMENT ON COLUMN consultations.completed_at IS 'Timestamp when consultation was completed';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_completed_at ON consultations(completed_at);
