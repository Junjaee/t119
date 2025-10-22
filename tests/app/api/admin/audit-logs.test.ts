// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md
// TAG-010: Audit Logs API Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listAuditLogs } from '@/app/api/admin/audit-logs/route';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock JWT verification
vi.mock('@/lib/auth/jwt', () => ({
  verifyToken: vi.fn(),
}));

// Mock Audit Log Service
vi.mock('@/features/admin/services/audit-log-service', () => ({
  AuditLogService: vi.fn().mockImplementation(() => ({
    list: vi.fn(),
  })),
}));

import { verifyToken } from '@/lib/auth/jwt';
import { AuditLogService } from '@/features/admin/services/audit-log-service';

describe('GET /api/admin/audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
    });

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if user is not admin', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'user@example.com',
      role: 'user',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should list audit logs with default pagination', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockLogs = [
      {
        id: 'log-1',
        user_id: 'admin-123',
        action: 'association_created',
        resource_type: 'association',
        resource_id: 'assoc-1',
        changes: {},
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla',
        created_at: new Date().toISOString(),
      },
    ];

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: mockLogs,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          total_pages: 1,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toEqual(mockLogs);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 1,
      total_pages: 1,
    });
  });

  it('should filter logs by date range', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          total_pages: 0,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/audit-logs?start_date=2025-01-01&end_date=2025-12-31',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }
    );

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
    });
  });

  it('should filter logs by action', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          total_pages: 0,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/audit-logs?action=user_approved',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }
    );

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      action: 'user_approved',
    });
  });

  it('should filter logs by user_id', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          total_pages: 0,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/audit-logs?user_id=admin-456',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }
    );

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      user_id: 'admin-456',
    });
  });

  it('should support custom pagination', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: [],
        pagination: {
          page: 2,
          limit: 100,
          total: 150,
          total_pages: 2,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/audit-logs?page=2&limit=100',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }
    );

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({
      page: 2,
      limit: 100,
    });
  });

  it('should handle combined filters', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          total_pages: 0,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/audit-logs?start_date=2025-01-01&action=user_approved&user_id=admin-456',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }
    );

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      start_date: '2025-01-01',
      action: 'user_approved',
      user_id: 'admin-456',
    });
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await listAuditLogs(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Database');
  });

  it('should cache audit logs for 60 seconds', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        logs: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          total_pages: 0,
        },
      },
    });

    vi.mocked(AuditLogService).mockImplementation(() => ({
      list: mockList,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await listAuditLogs(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
  });
});
