-- @CODE:INFRA-001:MIGRATION | SPEC: .moai/specs/SPEC-INFRA-001/spec.md

/**
 * Row Level Security (RLS) Policies
 *
 * @description
 * Implements role-based access control using Supabase RLS.
 *
 * @security-model
 * - Teachers: Can only access their own reports and consultations
 * - Lawyers: Can access assigned consultations and related reports
 * - Admins: Full access to all data
 *
 * @generated 2025-10-20
 * @spec SPEC-INFRA-001
 */

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Users Table Policies
-- ========================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT
    USING (auth.uid()::TEXT = id::TEXT);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid()::TEXT = id::TEXT);

-- Admins can read all users
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'admin'
        )
    );

-- Admins can manage all users
CREATE POLICY "Admins can manage users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'admin'
        )
    );

-- ========================================
-- Associations Table Policies
-- ========================================

-- All authenticated users can read associations
CREATE POLICY "Authenticated users can read associations" ON associations
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Admins can manage associations
CREATE POLICY "Admins can manage associations" ON associations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'admin'
        )
    );

-- ========================================
-- Reports Table Policies
-- ========================================

-- Teachers can read their own reports
CREATE POLICY "Teachers can read own reports" ON reports
    FOR SELECT
    USING (
        user_id::TEXT = auth.uid()::TEXT
        OR assigned_lawyer_id::TEXT = auth.uid()::TEXT
    );

-- Teachers can create reports
CREATE POLICY "Teachers can create reports" ON reports
    FOR INSERT
    WITH CHECK (
        user_id::TEXT = auth.uid()::TEXT
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'teacher'
        )
    );

-- Teachers can update their own reports (before assigned)
CREATE POLICY "Teachers can update own reports" ON reports
    FOR UPDATE
    USING (
        user_id::TEXT = auth.uid()::TEXT
        AND status = 'submitted'
    );

-- Lawyers can read assigned reports
CREATE POLICY "Lawyers can read assigned reports" ON reports
    FOR SELECT
    USING (
        assigned_lawyer_id::TEXT = auth.uid()::TEXT
        OR EXISTS (
            SELECT 1 FROM consultations
            WHERE report_id = reports.id
            AND lawyer_id::TEXT = auth.uid()::TEXT
        )
    );

-- Lawyers can update assigned reports (status only)
CREATE POLICY "Lawyers can update assigned reports" ON reports
    FOR UPDATE
    USING (
        assigned_lawyer_id::TEXT = auth.uid()::TEXT
        OR EXISTS (
            SELECT 1 FROM consultations
            WHERE report_id = reports.id
            AND lawyer_id::TEXT = auth.uid()::TEXT
        )
    );

-- Admins can manage all reports
CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'admin'
        )
    );

-- ========================================
-- Consultations Table Policies
-- ========================================

-- Teachers can read their own consultations
CREATE POLICY "Teachers can read own consultations" ON consultations
    FOR SELECT
    USING (teacher_id::TEXT = auth.uid()::TEXT);

-- Lawyers can read their consultations
CREATE POLICY "Lawyers can read own consultations" ON consultations
    FOR SELECT
    USING (lawyer_id::TEXT = auth.uid()::TEXT);

-- Teachers can update their consultations (feedback only)
CREATE POLICY "Teachers can update own consultations" ON consultations
    FOR UPDATE
    USING (teacher_id::TEXT = auth.uid()::TEXT);

-- Lawyers can update their consultations (status only)
CREATE POLICY "Lawyers can update own consultations" ON consultations
    FOR UPDATE
    USING (lawyer_id::TEXT = auth.uid()::TEXT);

-- Admins can manage all consultations
CREATE POLICY "Admins can manage consultations" ON consultations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'admin'
        )
    );

-- ========================================
-- Messages Table Policies
-- ========================================

-- Consultation participants can read messages
CREATE POLICY "Participants can read messages" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM consultations
            WHERE id = messages.consultation_id
            AND (
                teacher_id::TEXT = auth.uid()::TEXT
                OR lawyer_id::TEXT = auth.uid()::TEXT
            )
        )
    );

-- Consultation participants can send messages
CREATE POLICY "Participants can send messages" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id::TEXT = auth.uid()::TEXT
        AND EXISTS (
            SELECT 1 FROM consultations
            WHERE id = messages.consultation_id
            AND (
                teacher_id::TEXT = auth.uid()::TEXT
                OR lawyer_id::TEXT = auth.uid()::TEXT
            )
        )
    );

-- Participants can mark messages as read
CREATE POLICY "Participants can mark messages as read" ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM consultations
            WHERE id = messages.consultation_id
            AND (
                teacher_id::TEXT = auth.uid()::TEXT
                OR lawyer_id::TEXT = auth.uid()::TEXT
            )
        )
    );

-- ========================================
-- Evidence Files Table Policies
-- ========================================

-- Report owner can read their evidence files
CREATE POLICY "Report owner can read evidence files" ON evidence_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reports
            WHERE id = evidence_files.report_id
            AND (
                user_id::TEXT = auth.uid()::TEXT
                OR assigned_lawyer_id::TEXT = auth.uid()::TEXT
            )
        )
    );

-- Report owner can upload evidence files
CREATE POLICY "Report owner can upload evidence files" ON evidence_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reports
            WHERE id = evidence_files.report_id
            AND user_id::TEXT = auth.uid()::TEXT
        )
    );

-- Report owner can delete evidence files
CREATE POLICY "Report owner can delete evidence files" ON evidence_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM reports
            WHERE id = evidence_files.report_id
            AND user_id::TEXT = auth.uid()::TEXT
        )
    );

-- Admins can manage all evidence files
CREATE POLICY "Admins can manage evidence files" ON evidence_files
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'admin'
        )
    );
