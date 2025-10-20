// @CODE:INFRA-001:DATA | SPEC: .moai/specs/SPEC-INFRA-001/spec.md | TEST: tests/lib/supabase/client.test.ts

/**
 * Supabase Database Types
 *
 * @description
 * This file contains TypeScript types generated from Supabase database schema.
 *
 * @generation
 * Auto-generated using: npx supabase gen types typescript --local > src/types/database.types.ts
 *
 * @manual-types
 * Until Supabase project is created and types are generated,
 * we define manual types based on SPEC-INFRA-001.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          role: 'teacher' | 'lawyer' | 'admin';
          association_id: string | null;
          anonymous_nickname: string | null;
          ip_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          role: 'teacher' | 'lawyer' | 'admin';
          association_id?: string | null;
          anonymous_nickname?: string | null;
          ip_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          role?: 'teacher' | 'lawyer' | 'admin';
          association_id?: string | null;
          anonymous_nickname?: string | null;
          ip_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      associations: {
        Row: {
          id: string;
          name: string;
          type: 'teacher' | 'lawyer';
          region: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'teacher' | 'lawyer';
          region?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'teacher' | 'lawyer';
          region?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: 'parent' | 'student' | 'colleague' | 'other';
          incident_date: string;
          status: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
          assigned_lawyer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: 'parent' | 'student' | 'colleague' | 'other';
          incident_date: string;
          status?: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
          assigned_lawyer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: 'parent' | 'student' | 'colleague' | 'other';
          incident_date?: string;
          status?: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
          assigned_lawyer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      consultations: {
        Row: {
          id: string;
          report_id: string;
          teacher_id: string;
          lawyer_id: string;
          status: 'pending' | 'active' | 'completed' | 'cancelled';
          satisfaction_score: number | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          teacher_id: string;
          lawyer_id: string;
          status?: 'pending' | 'active' | 'completed' | 'cancelled';
          satisfaction_score?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          teacher_id?: string;
          lawyer_id?: string;
          status?: 'pending' | 'active' | 'completed' | 'cancelled';
          satisfaction_score?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          consultation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          consultation_id?: string;
          sender_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      evidence_files: {
        Row: {
          id: string;
          report_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          uploaded_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'teacher' | 'lawyer' | 'admin';
      association_type: 'teacher' | 'lawyer';
      report_category: 'parent' | 'student' | 'colleague' | 'other';
      report_status: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
      consultation_status: 'pending' | 'active' | 'completed' | 'cancelled';
    };
  };
}
