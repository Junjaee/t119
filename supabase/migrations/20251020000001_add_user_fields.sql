-- @CODE:INFRA-001:MIGRATION | SPEC: .moai/specs/SPEC-INFRA-001/spec.md
-- Add missing user fields for registration and authentication

/**
 * Migration: Add User Fields
 *
 * @description
 * Adds missing fields to the users table for:
 * - Association approval tracking
 * - Email verification status
 * - Account activation status
 * - Teacher-specific information (phone, school, position)
 * - Nickname management
 *
 * @generated 2025-10-20
 * @spec SPEC-INFRA-001
 */

-- Add missing columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS association_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS school VARCHAR(255),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

-- Create index for active users lookup
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Create index for verified users
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

-- Add comment to describe association_approved
COMMENT ON COLUMN users.association_approved IS 'Whether the user has been approved by their association (teachers only)';
COMMENT ON COLUMN users.is_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.phone IS 'User phone number (teachers only)';
COMMENT ON COLUMN users.school IS 'School name (teachers only)';
COMMENT ON COLUMN users.position IS 'Position or title (teachers only)';
COMMENT ON COLUMN users.nickname IS 'Display nickname (for anonymity)';
