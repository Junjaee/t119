// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md
// Database Schema Tests

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('TAG-001: Database Schema', () => {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20251022000000_admin_tables.sql');
  const migration = readFileSync(migrationPath, 'utf-8');

  describe('Migration File', () => {
    it('should exist and be readable', () => {
      expect(migration).toBeDefined();
      expect(migration.length).toBeGreaterThan(0);
    });

    it('should have TAG marker', () => {
      expect(migration).toContain('@CODE:ADMIN-001:DATA');
      expect(migration).toContain('SPEC: .moai/specs/SPEC-ADMIN-001/spec.md');
    });
  });

  describe('Table: associations', () => {
    it('should alter associations table with new columns', () => {
      expect(migration).toContain('ALTER TABLE associations');
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS description VARCHAR(500)');
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)');
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL');
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL');
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)');
    });

    it('should enforce unique constraint on name', () => {
      expect(migration).toContain('ADD CONSTRAINT associations_name_unique UNIQUE (name)');
    });

    it('should enforce check constraint on name length (2-50 chars) - C-001', () => {
      expect(migration).toContain('associations_name_length_check');
      expect(migration).toContain('LENGTH(name) >= 2 AND LENGTH(name) <= 50');
    });

    it('should enforce check constraint on description length (max 500 chars)', () => {
      expect(migration).toContain('associations_description_length_check');
      expect(migration).toContain('LENGTH(description) <= 500');
    });

    it('should have index on created_by', () => {
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_associations_created_by ON associations(created_by)');
    });

    it('should have index on is_deleted for soft delete queries', () => {
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_associations_is_deleted ON associations(is_deleted)');
    });

    it('should have index on region for filtering', () => {
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_associations_region ON associations(region)');
    });
  });

  describe('Table: association_members', () => {
    it('should create association_members table', () => {
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS association_members');
    });

    it('should have all required columns', () => {
      expect(migration).toContain('id UUID PRIMARY KEY DEFAULT uuid_generate_v4()');
      expect(migration).toContain('association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE');
      expect(migration).toContain('user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE');
      expect(migration).toContain("role VARCHAR(20) NOT NULL DEFAULT 'member'");
      expect(migration).toContain('joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    });

    it('should enforce unique constraint on association_id + user_id', () => {
      expect(migration).toContain('CONSTRAINT association_members_unique UNIQUE (association_id, user_id)');
    });

    it('should enforce check constraint on role', () => {
      expect(migration).toContain("CHECK (role IN ('admin', 'member'))");
    });

    it('should have indexes for performance', () => {
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_association_members_association ON association_members(association_id)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_association_members_user ON association_members(user_id)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_association_members_role ON association_members(role)');
    });
  });

  describe('Table: user_approvals', () => {
    it('should create user_approvals table', () => {
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS user_approvals');
    });

    it('should have all required columns', () => {
      expect(migration).toContain('id UUID PRIMARY KEY DEFAULT uuid_generate_v4()');
      expect(migration).toContain('user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE');
      expect(migration).toContain('association_id UUID REFERENCES associations(id) ON DELETE SET NULL');
      expect(migration).toContain("status VARCHAR(20) NOT NULL DEFAULT 'pending'");
      expect(migration).toContain('reason VARCHAR(200) NOT NULL');
      expect(migration).toContain('rejected_reason VARCHAR(200)');
      expect(migration).toContain('approved_by UUID REFERENCES users(id) ON DELETE SET NULL');
    });

    it('should enforce check constraint on status', () => {
      expect(migration).toContain("CHECK (status IN ('pending', 'approved', 'rejected'))");
    });

    it('should enforce check constraint on reason length (1-200 chars)', () => {
      expect(migration).toContain('user_approvals_reason_length_check');
      expect(migration).toContain('LENGTH(reason) >= 1 AND LENGTH(reason) <= 200');
    });

    it('should enforce check constraint on rejected_reason length', () => {
      expect(migration).toContain('user_approvals_rejected_reason_length_check');
      expect(migration).toContain('LENGTH(rejected_reason) >= 1 AND LENGTH(rejected_reason) <= 200');
    });

    it('should have indexes for performance', () => {
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_user_approvals_user ON user_approvals(user_id)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_user_approvals_status ON user_approvals(status)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_user_approvals_created ON user_approvals(created_at DESC)');
    });
  });

  describe('Table: audit_logs', () => {
    it('should create audit_logs table', () => {
      expect(migration).toContain('CREATE TABLE IF NOT EXISTS audit_logs');
    });

    it('should have all required columns', () => {
      expect(migration).toContain('id UUID PRIMARY KEY DEFAULT uuid_generate_v4()');
      expect(migration).toContain('user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE');
      expect(migration).toContain('action VARCHAR(100) NOT NULL');
      expect(migration).toContain('resource_type VARCHAR(50) NOT NULL');
      expect(migration).toContain('resource_id UUID NOT NULL');
      expect(migration).toContain('changes JSONB');
      expect(migration).toContain('ip_address VARCHAR(45) NOT NULL');
      expect(migration).toContain('user_agent TEXT NOT NULL');
      expect(migration).toContain('created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    });

    it('should have indexes for performance (P-007: 1M+ logs support)', () => {
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)');
      expect(migration).toContain('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)');
    });

    it('should support JSONB for changes column', () => {
      expect(migration).toContain('changes JSONB');
    });
  });

  describe('Triggers', () => {
    it('should have auto-update trigger for associations', () => {
      expect(migration).toContain('CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON associations');
      expect(migration).toContain('FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    });

    it('should have auto-update trigger for user_approvals', () => {
      expect(migration).toContain('CREATE TRIGGER update_user_approvals_updated_at BEFORE UPDATE ON user_approvals');
      expect(migration).toContain('FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    });
  });

  describe('Comments', () => {
    it('should have table comments', () => {
      expect(migration).toContain("COMMENT ON TABLE associations IS 'Admin-managed associations");
      expect(migration).toContain("COMMENT ON TABLE association_members IS 'Association membership");
      expect(migration).toContain("COMMENT ON TABLE user_approvals IS 'User approval queue");
      expect(migration).toContain("COMMENT ON TABLE audit_logs IS 'Admin action audit logs");
    });

    it('should have column comments', () => {
      expect(migration).toContain("COMMENT ON COLUMN associations.is_public");
      expect(migration).toContain("COMMENT ON COLUMN associations.is_deleted");
      expect(migration).toContain("COMMENT ON COLUMN user_approvals.reason");
      expect(migration).toContain("COMMENT ON COLUMN audit_logs.changes");
    });
  });
});
