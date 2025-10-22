// @CODE:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/services/approval-service.test.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];

/**
 * Service for managing user approval workflows
 *
 * Features:
 * - Get pending approvals
 * - Approve/reject users
 * - Detect long-pending approvals (>24h)
 */
export class ApprovalService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get all users pending approval
   */
  async getPendingApprovals(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('approved', false);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Approve a user by ID
   */
  async approveUser(userId: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ approved: true, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('User not found');
    }

    return data;
  }

  /**
   * Reject a user by ID
   */
  async rejectUser(userId: string, reason?: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        approved: false,
        updated_at: new Date().toISOString(),
        // Note: rejection_reason field would need to be added to schema
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('User not found');
    }

    return data;
  }

  /**
   * Get users pending for more than 24 hours
   */
  async getLongPendingApprovals(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('approved', false);

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    // Filter users pending > 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return data.filter((user) => {
      const createdAt = new Date(user.created_at);
      return createdAt < twentyFourHoursAgo;
    });
  }

  /**
   * Get approval by user ID
   */
  async getApprovalById(userId: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('User not found');
    }

    return data;
  }
}
