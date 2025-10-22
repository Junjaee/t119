// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md
// TAG-009: Dashboard API Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getDashboard } from '@/app/api/admin/dashboard/route';

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

// Mock Dashboard Service
vi.mock('@/features/admin/services/dashboard-service', () => ({
  DashboardService: vi.fn().mockImplementation(() => ({
    getOverviewStats: vi.fn(),
    getRecentActivities: vi.fn(),
    getAlerts: vi.fn(),
  })),
}));

import { verifyToken } from '@/lib/auth/jwt';
import { DashboardService } from '@/features/admin/services/dashboard-service';

describe('GET /api/admin/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
    });

    const response = await getDashboard(request);
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

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const response = await getDashboard(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should return dashboard data successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockOverview = {
      totalUsers: 100,
      pendingApprovals: 5,
      totalAssociations: 10,
    };

    const mockActivities = [
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

    const mockAlerts = [
      {
        type: 'pending_approvals',
        message: '3 user(s) pending approval for >24h',
        severity: 'warning' as const,
        timestamp: new Date().toISOString(),
      },
    ];

    const mockGetOverview = vi.fn().mockResolvedValue(mockOverview);
    const mockGetActivities = vi.fn().mockResolvedValue(mockActivities);
    const mockGetAlerts = vi.fn().mockResolvedValue(mockAlerts);

    vi.mocked(DashboardService).mockImplementation(() => ({
      getOverviewStats: mockGetOverview,
      getRecentActivities: mockGetActivities,
      getAlerts: mockGetAlerts,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await getDashboard(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overview).toEqual(mockOverview);
    expect(data.recent_activities).toEqual(mockActivities);
    expect(data.alerts).toEqual(mockAlerts);
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockGetOverview = vi.fn().mockRejectedValue(new Error('Database error'));

    vi.mocked(DashboardService).mockImplementation(() => ({
      getOverviewStats: mockGetOverview,
      getRecentActivities: vi.fn(),
      getAlerts: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await getDashboard(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should cache dashboard data for 5 minutes', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockGetOverview = vi.fn().mockResolvedValue({
      totalUsers: 100,
      pendingApprovals: 5,
      totalAssociations: 10,
    });
    const mockGetActivities = vi.fn().mockResolvedValue([]);
    const mockGetAlerts = vi.fn().mockResolvedValue([]);

    vi.mocked(DashboardService).mockImplementation(() => ({
      getOverviewStats: mockGetOverview,
      getRecentActivities: mockGetActivities,
      getAlerts: mockGetAlerts,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await getDashboard(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
  });
});
