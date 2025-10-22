-- @CODE:ADMIN-001:DATA | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/database/schema.test.ts

/**
 * Admin Management System Tables
 *
 * @description
 * Creates tables for admin association management, user approvals, and audit logging.
 *
 * @tables
 * - associations: Admin-managed associations (협회 관리)
 * - association_members: Association membership (협회 회원)
 * - user_approvals: User approval queue (사용자 승인 대기)
 * - audit_logs: Admin action audit logs (감사 로그)
 *
 * @generated 2025-10-22
 * @spec SPEC-ADMIN-001
 */

-- ============================================================================
-- ADMIN ASSOCIATIONS TABLE
-- ============================================================================

-- Drop existing associations table if exists (from initial schema)
-- We need to recreate it with admin-specific constraints
ALTER TABLE IF EXISTS associations DROP CONSTRAINT IF EXISTS associations_name_key;

-- Add new columns to existing associations table
ALTER TABLE associations
  ADD COLUMN IF NOT EXISTS description VARCHAR(500),
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Re-add unique constraint on name
ALTER TABLE associations ADD CONSTRAINT associations_name_unique UNIQUE (name);

-- Add check constraint on name length (2-50 chars) - C-001
ALTER TABLE associations ADD CONSTRAINT associations_name_length_check
  CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 50);

-- Add check constraint on description length (max 500 chars)
ALTER TABLE associations ADD CONSTRAINT associations_description_length_check
  CHECK (description IS NULL OR LENGTH(description) <= 500);

-- Create index on created_by for admin queries
CREATE INDEX IF NOT EXISTS idx_associations_created_by ON associations(created_by);

-- Create index on is_deleted for soft delete queries
CREATE INDEX IF NOT EXISTS idx_associations_is_deleted ON associations(is_deleted);

-- Create index on region for filtering
CREATE INDEX IF NOT EXISTS idx_associations_region ON associations(region);

-- ============================================================================
-- ASSOCIATION MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS association_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: one user can only be a member once per association
    CONSTRAINT association_members_unique UNIQUE (association_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_association_members_association ON association_members(association_id);
CREATE INDEX IF NOT EXISTS idx_association_members_user ON association_members(user_id);
CREATE INDEX IF NOT EXISTS idx_association_members_role ON association_members(role);

-- ============================================================================
-- USER APPROVALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    association_id UUID REFERENCES associations(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason VARCHAR(200) NOT NULL,
    rejected_reason VARCHAR(200),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add check constraint on reason length (1-200 chars)
ALTER TABLE user_approvals ADD CONSTRAINT user_approvals_reason_length_check
  CHECK (LENGTH(reason) >= 1 AND LENGTH(reason) <= 200);

-- Add check constraint on rejected_reason length (1-200 chars if provided)
ALTER TABLE user_approvals ADD CONSTRAINT user_approvals_rejected_reason_length_check
  CHECK (rejected_reason IS NULL OR (LENGTH(rejected_reason) >= 1 AND LENGTH(rejected_reason) <= 200));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_approvals_user ON user_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvals_status ON user_approvals(status);
CREATE INDEX IF NOT EXISTS idx_user_approvals_created ON user_approvals(created_at DESC);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    changes JSONB,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance (P-007: 1M+ audit logs support)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for associations
CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON associations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for user_approvals
CREATE TRIGGER update_user_approvals_updated_at BEFORE UPDATE ON user_approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE associations IS 'Admin-managed associations (협회 관리)';
COMMENT ON TABLE association_members IS 'Association membership (협회 회원)';
COMMENT ON TABLE user_approvals IS 'User approval queue (사용자 승인 대기)';
COMMENT ON TABLE audit_logs IS 'Admin action audit logs (감사 로그)';

COMMENT ON COLUMN associations.is_public IS 'Public visibility (default: true)';
COMMENT ON COLUMN associations.is_deleted IS 'Soft delete flag (default: false)';
COMMENT ON COLUMN associations.created_by IS 'Admin user who created this association';

COMMENT ON COLUMN user_approvals.reason IS 'User application reason (1-200 chars)';
COMMENT ON COLUMN user_approvals.rejected_reason IS 'Admin rejection reason (1-200 chars, optional)';

COMMENT ON COLUMN audit_logs.changes IS 'JSON object containing change details';
COMMENT ON COLUMN audit_logs.ip_address IS 'IPv4 or IPv6 address';
