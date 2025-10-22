// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md

import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from '@/features/admin/services/dashboard-service';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];

describe('DashboardService', () => {
  let service: DashboardService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: (table: string) => ({
        select: () => ({
          data: null,
          count: 0,
          error: null,
          eq: () => ({
            data: null,
            count: 0,
            error: null,
          }),
          order: () => ({
            limit: () => ({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    };
    service = new DashboardService(mockSupabase);
  });

  describe('getOverviewStats', () => {
    it('should return dashboard overview statistics', async () => {
      let callCount = 0;
      mockSupabase.from = (table: string) => ({
        select: () => {
          callCount++;
          return {
            data: null,
            count: callCount === 1 ? 100 : callCount === 2 ? 25 : 15,
            error: null,
            eq: () => ({
              data: null,
              count: 25,
              error: null,
            }),
          };
        },
      });

      const stats = await service.getOverviewStats();
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('pendingApprovals');
      expect(stats).toHaveProperty('totalAssociations');
      expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero counts', async () => {
      const stats = await service.getOverviewStats();
      expect(stats.totalUsers).toBe(0);
      expect(stats.pendingApprovals).toBe(0);
      expect(stats.totalAssociations).toBe(0);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          data: null,
          count: null,
          error: { message: 'Database error' },
          eq: () => ({
            data: null,
            count: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(service.getOverviewStats()).rejects.toThrow('Database error');
    });
  });

  describe('getRecentActivities', () => {
    it('should return recent admin activities', async () => {
      const mockActivities = [
        {
          id: '1',
          user_id: 'admin-1',
          action: 'approve_user',
          resource_type: 'user',
          resource_id: 'user-1',
          details: null,
          ip_address: null,
          user_agent: null,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from = () => ({
        select: () => ({
          order: () => ({
            limit: () => ({
              data: mockActivities,
              error: null,
            }),
          }),
        }),
      });

      const activities = await service.getRecentActivities();
      expect(Array.isArray(activities)).toBe(true);
    });

    it('should support custom limit', async () => {
      const mockActivities = Array.from({ length: 20 }, (_, i) => ({
        id: `${i + 1}`,
        user_id: 'admin-1',
        action: 'test',
        resource_type: 'test',
        resource_id: null,
        details: null,
        ip_address: null,
        user_agent: null,
        created_at: new Date().toISOString(),
      }));

      mockSupabase.from = () => ({
        select: () => ({
          order: () => ({
            limit: (n: number) => ({
              data: mockActivities.slice(0, n),
              error: null,
            }),
          }),
        }),
      });

      const activities = await service.getRecentActivities(5);
      expect(activities.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no activities', async () => {
      const activities = await service.getRecentActivities();
      expect(activities).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          order: () => ({
            limit: () => ({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      });

      await expect(service.getRecentActivities()).rejects.toThrow('Query failed');
    });
  });

  describe('getAlerts', () => {
    it('should detect long-pending approvals as alerts', async () => {
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

      const alerts = await service.getAlerts();
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('type');
      expect(alerts[0]).toHaveProperty('message');
      expect(alerts[0]).toHaveProperty('severity');
    });

    it('should return no alerts when all approvals recent', async () => {
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

      const alerts = await service.getAlerts();
      expect(alerts).toEqual([]);
    });

    it('should return empty array on database error', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const alerts = await service.getAlerts();
      expect(alerts).toEqual([]);
    });

    it('should categorize alerts by severity', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const mockUsers: User[] = [
        {
          id: '1',
          email: 'old@test.com',
          name: 'Old User',
          role: 'user',
          approved: false,
          created_at: threeDaysAgo.toISOString(),
          updated_at: threeDaysAgo.toISOString(),
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

      const alerts = await service.getAlerts();
      expect(alerts[0].severity).toMatch(/warning|error|info/);
    });
  });

  describe('getUserGrowthStats', () => {
    it('should return user growth statistics', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          data: null,
          count: 150,
          error: null,
        }),
      });

      const stats = await service.getUserGrowthStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('thisMonth');
      expect(stats).toHaveProperty('lastMonth');
    });

    it('should handle zero growth', async () => {
      const stats = await service.getUserGrowthStats();
      expect(stats.total).toBe(0);
      expect(stats.thisMonth).toBe(0);
      expect(stats.lastMonth).toBe(0);
    });

    it('should calculate growth percentage', async () => {
      mockSupabase.from = () => ({
        select: () => ({
          data: null,
          count: 100,
          error: null,
        }),
      });

      const stats = await service.getUserGrowthStats();
      expect(stats).toHaveProperty('growthPercentage');
      expect(typeof stats.growthPercentage).toBe('number');
    });
  });
});
