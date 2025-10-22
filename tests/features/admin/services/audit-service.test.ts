// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '@/features/admin/services/audit-service';
import type { Database } from '@/lib/supabase/types';

type Tables = Database['public']['Tables'];
type AuditLog = Tables['audit_logs']['Row'];

describe('AuditService', () => {
  let service: AuditService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: (table: string) => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              data: null,
              error: null,
            }),
          }),
        }),
        select: () => ({
          order: () => ({
            limit: () => ({
              data: [],
              error: null,
            }),
          }),
          eq: () => ({
            order: () => ({
              limit: () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }),
    };
    service = new AuditService(mockSupabase);
  });

  describe('logAction', () => {
    it('should log admin action successfully', async () => {
      const mockLog: AuditLog = {
        id: '1',
        user_id: 'admin-1',
        action: 'approve_user',
        resource_type: 'user',
        resource_id: 'user-1',
        details: { reason: 'Verified credentials' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        created_at: new Date().toISOString(),
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              data: mockLog,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.logAction({
        userId: 'admin-1',
        action: 'approve_user',
        resourceType: 'user',
        resourceId: 'user-1',
        details: { reason: 'Verified credentials' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockLog);
    });

    it('should handle missing optional fields', async () => {
      const mockLog: AuditLog = {
        id: '1',
        user_id: 'admin-1',
        action: 'view_dashboard',
        resource_type: 'dashboard',
        resource_id: null,
        details: null,
        ip_address: null,
        user_agent: null,
        created_at: new Date().toISOString(),
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              data: mockLog,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.logAction({
        userId: 'admin-1',
        action: 'view_dashboard',
        resourceType: 'dashboard',
      });

      expect(result.action).toBe('view_dashboard');
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      await expect(
        service.logAction({
          userId: 'admin-1',
          action: 'test',
          resourceType: 'test',
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs with default limit', async () => {
      const mockLogs: AuditLog[] = [
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
              data: mockLogs,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getAuditLogs();
      expect(result).toEqual(mockLogs);
    });

    it('should support custom limit', async () => {
      const mockLogs: AuditLog[] = Array.from({ length: 5 }, (_, i) => ({
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
              data: mockLogs.slice(0, n),
              error: null,
            }),
          }),
        }),
      });

      const result = await service.getAuditLogs(5);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should filter by user ID', async () => {
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          user_id: 'admin-1',
          action: 'test',
          resource_type: 'test',
          resource_id: null,
          details: null,
          ip_address: null,
          user_agent: null,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getAuditLogs(100, 'admin-1');
      expect(result.every((log) => log.user_id === 'admin-1')).toBe(true);
    });

    it('should return empty array when no logs', async () => {
      const result = await service.getAuditLogs();
      expect(result).toEqual([]);
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

      await expect(service.getAuditLogs()).rejects.toThrow('Query failed');
    });
  });

  describe('getLogsByAction', () => {
    it('should filter logs by action type', async () => {
      const mockLogs: AuditLog[] = [
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
          eq: () => ({
            order: () => ({
              limit: () => ({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getLogsByAction('approve_user');
      expect(result.every((log) => log.action === 'approve_user')).toBe(true);
    });

    it('should support custom limit for action filter', async () => {
      const mockLogs: AuditLog[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        user_id: 'admin-1',
        action: 'approve_user',
        resource_type: 'user',
        resource_id: null,
        details: null,
        ip_address: null,
        user_agent: null,
        created_at: new Date().toISOString(),
      }));

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: (n: number) => ({
                data: mockLogs.slice(0, n),
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getLogsByAction('approve_user', 5);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });
});
