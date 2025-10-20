-- @CODE:INFRA-001:MIGRATION | SPEC: .moai/specs/SPEC-INFRA-001/spec.md

/**
 * Initial Database Schema
 *
 * @description
 * Creates the core database schema for Teacher119 platform.
 *
 * @tables
 * - users: User accounts (teachers, lawyers, admins)
 * - associations: Teacher/Lawyer associations
 * - reports: Teacher rights violation reports
 * - consultations: Lawyer-Teacher consultations
 * - messages: Real-time messaging
 * - evidence_files: Report evidence file metadata
 *
 * @generated 2025-10-20
 * @spec SPEC-INFRA-001
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('teacher', 'lawyer', 'admin');
CREATE TYPE association_type AS ENUM ('teacher', 'lawyer');
CREATE TYPE report_category AS ENUM ('parent', 'student', 'colleague', 'other');
CREATE TYPE report_status AS ENUM ('submitted', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE consultation_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Table: associations
CREATE TABLE associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type association_type NOT NULL,
    region VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    association_id UUID REFERENCES associations(id) ON DELETE SET NULL,
    anonymous_nickname VARCHAR(50),
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category report_category NOT NULL,
    incident_date DATE NOT NULL,
    status report_status DEFAULT 'submitted',
    assigned_lawyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: consultations
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lawyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status consultation_status DEFAULT 'pending',
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: evidence_files
CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_association ON users(association_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_lawyer ON reports(assigned_lawyer_id);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
CREATE INDEX idx_consultations_report ON consultations(report_id);
CREATE INDEX idx_consultations_teacher ON consultations(teacher_id);
CREATE INDEX idx_consultations_lawyer ON consultations(lawyer_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_messages_consultation ON messages(consultation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_evidence_files_report ON evidence_files(report_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
