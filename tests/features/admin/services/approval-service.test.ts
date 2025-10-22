// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md

import { describe, it, expect, beforeEach } from 'vitest';
import { ApprovalService } from '@/features/admin/services/approval-service';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Association = Tables['associations']['Row'];

describe('ApprovalService', () => {
  let service: ApprovalService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            data: [],
            error: null,
          }),
          in: () => ({
            data: [],
            error: null,
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
    service = new ApprovalService(mockSupabase);
  });

  describe('getPendingApprovals', () => {
    it('should return all pending users', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'user1@test.com',
          name: 'User 1',
          role: 'user',
          approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'user2@test.com',
          name: 'User 2',
          role: 'user',
          approved: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            data: mockUsers,
            error: null,
          }),
        }),
      });

      const result = await service.getPendingApprovals();
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no pending users', async () => {
      const result = await service.getPendingApprovals();
      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(service.getPendingApprovals()).rejects.toThrow('Database error');
    });
  });

  describe('approveUser', () => {
    it('should approve user and return updated user', async () => {
      const userId = '1';
      const updatedUser: User = {
        id: userId,
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.approveUser(userId);
      expect(result.approved).toBe(true);
      expect(result.id).toBe(userId);
    });

    it('should throw error when user not found', async () => {
      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: null,
                error: { message: 'User not found', code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      await expect(service.approveUser('invalid')).rejects.toThrow('User not found');
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        }),
      });

      await expect(service.approveUser('1')).rejects.toThrow('Update failed');
    });
  });

  describe('rejectUser', () => {
    it('should reject user and return updated user', async () => {
      const userId = '1';
      const updatedUser: User = {
        id: userId,
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.rejectUser(userId, 'Invalid credentials');
      expect(result.id).toBe(userId);
    });

    it('should accept optional rejection reason', async () => {
      const updatedUser: User = {
        id: '1',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: updatedUser,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.rejectUser('1');
      expect(result).toBeDefined();
    });

    it('should throw error when user not found', async () => {
      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                data: null,
                error: { message: 'User not found', code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      await expect(service.rejectUser('invalid')).rejects.toThrow('User not found');
    });
  });

  describe('getLongPendingApprovals', () => {
    it('should return users pending for more than 24 hours', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const mockUsers: User[] = [
        {
          id: '1',
          email: 'old@test.com',
          name: 'Old User',
          role: 'user',
          approved: false,
          created_at: twoDaysAgo.toISOString(),
          updated_at: twoDaysAgo.toISOString(),
        },
      ];

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            data: mockUsers,
            error: null,
          }),
        }),
      });

      const result = await service.getLongPendingApprovals();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not return users pending for less than 24 hours', async () => {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const mockUsers: User[] = [
        {
          id: '1',
          email: 'new@test.com',
          name: 'New User',
          role: 'user',
          approved: false,
          created_at: oneHourAgo.toISOString(),
          updated_at: oneHourAgo.toISOString(),
        },
      ];

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            data: mockUsers,
            error: null,
          }),
        }),
      });

      const result = await service.getLongPendingApprovals();
      expect(result).toEqual([]);
    });

    it('should return empty array when no pending users', async () => {
      const result = await service.getLongPendingApprovals();
      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(service.getLongPendingApprovals()).rejects.toThrow('Database error');
    });
  });

  describe('getApprovalById', () => {
    it('should return user by id', async () => {
      const mockUser: User = {
        id: '1',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            single: () => ({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getApprovalById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when user not found', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            single: () => ({
              data: null,
              error: { message: 'User not found', code: 'PGRST116' },
            }),
          }),
        }),
      });

      await expect(service.getApprovalById('invalid')).rejects.toThrow('User not found');
    });
  });
});
