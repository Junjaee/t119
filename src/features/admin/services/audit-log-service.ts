// @CODE:ADMIN-001:DOMAIN | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/services/audit-log-service.test.ts

/**
 * Audit Log Service
 *
 * @description
 * Business logic for audit logs management.
 * - Query logs with filters (date range, action, user_id)
 * - Pagination support
 * - Read-only access (S-008)
 *
 * @spec SPEC-ADMIN-001
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type AuditLog = Tables['audit_logs']['Row'];

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  action?: string;
  user_id?: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface ServiceResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class AuditLogService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List audit logs with pagination and filters
   * - Supports date range filter
   * - Supports action filter
   * - Supports user_id filter
   * - Default: page=1, limit=50
   */
  async list(
    filters: AuditLogFilters
  ): Promise<ServiceResponse<AuditLogListResponse>> {
    const { page = 1, limit = 50, start_date, end_date, action, user_id } = filters;

    let query = this.supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    if (action) {
      query = query.eq('action', action);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return {
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
        },
      };
    }

    return {
      data: {
        logs: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    };
  }

  /**
   * Get audit log by ID
   */
  async getById(id: string): Promise<ServiceResponse<AuditLog>> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: '감사 로그를 찾을 수 없습니다',
        },
      };
    }

    return { data };
  }

  /**
   * Create audit log (for admin actions)
   * - S-007: All admin actions must be logged
   */
  async create(
    user_id: string,
    action: string,
    resource_type: string,
    resource_id: string,
    changes?: object,
    ip_address?: string,
    user_agent?: string
  ): Promise<ServiceResponse<AuditLog>> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert({
        user_id,
        action,
        resource_type,
        resource_id,
        changes: changes || {},
        ip_address: ip_address || 'unknown',
        user_agent: user_agent || 'unknown',
      })
      .select()
      .single();

    if (error) {
      return {
        error: {
          code: 'DATABASE_ERROR',
          message: error.message,
        },
      };
    }

    return { data };
  }
}
