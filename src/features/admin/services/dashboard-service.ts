// @CODE:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/services/dashboard-service.test.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type AuditLog = Tables['audit_logs']['Row'];
type User = Tables['users']['Row'];

export interface OverviewStats {
  totalUsers: number;
  pendingApprovals: number;
  totalAssociations: number;
}

export interface Alert {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
}

export interface UserGrowthStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growthPercentage: number;
}

/**
 * Service for admin dashboard data
 *
 * Features:
 * - Overview statistics
 * - Recent activities
 * - System alerts
 * - User growth metrics
 */
export class DashboardService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get overview statistics
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [usersResult, approvalsResult, associationsResult] = await Promise.all([
      this.supabase.from('users').select('*', { count: 'exact', head: true }),
      this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false),
      this.supabase.from('associations').select('*', { count: 'exact', head: true }),
    ]);

    if (usersResult.error) throw new Error(usersResult.error.message);
    if (approvalsResult.error) throw new Error(approvalsResult.error.message);
    if (associationsResult.error) throw new Error(associationsResult.error.message);

    return {
      totalUsers: usersResult.count || 0,
      pendingApprovals: approvalsResult.count || 0,
      totalAssociations: associationsResult.count || 0,
    };
  }

  /**
   * Get recent admin activities
   */
  async getRecentActivities(limit = 10): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get system alerts
   */
  async getAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Check for long-pending approvals
      const { data: pendingUsers, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('approved', false);

      if (error) {
        return alerts;
      }

      if (pendingUsers) {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const longPending = pendingUsers.filter((user) => {
          const createdAt = new Date(user.created_at);
          return createdAt < twentyFourHoursAgo;
        });

        if (longPending.length > 0) {
          alerts.push({
            type: 'pending_approvals',
            message: `${longPending.length} user(s) pending approval for >24h`,
            severity: 'warning',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      // Silently fail and return empty alerts
    }

    return alerts;
  }

  /**
   * Get user growth statistics
   */
  async getUserGrowthStats(): Promise<UserGrowthStats> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalResult, thisMonthResult, lastMonthResult] = await Promise.all([
      this.supabase.from('users').select('*', { count: 'exact', head: true }),
      this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
      this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
    ]);

    const total = totalResult.count || 0;
    const thisMonth = thisMonthResult.count || 0;
    const lastMonth = lastMonthResult.count || 0;

    const growthPercentage =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      total,
      thisMonth,
      lastMonth,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
    };
  }
}
