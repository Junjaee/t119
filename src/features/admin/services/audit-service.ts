// @CODE:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/services/audit-service.test.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type AuditLog = Tables['audit_logs']['Row'];

export interface LogActionParams {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for audit logging
 *
 * Features:
 * - Log admin actions
 * - Query audit logs (read-only)
 * - Filter by user, action, resource
 */
export class AuditService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Log an admin action
   */
  async logAction(params: LogActionParams): Promise<AuditLog> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId || null,
        details: params.details || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to create audit log');
    }

    return data;
  }

  /**
   * Get audit logs with optional filtering
   */
  async getAuditLogs(limit = 100, userId?: string): Promise<AuditLog[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get logs filtered by action type
   */
  async getLogsByAction(action: string, limit = 100): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
}
