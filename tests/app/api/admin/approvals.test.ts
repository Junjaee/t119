// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md
// TAG-008: Approval APIs Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as listApprovals } from '@/app/api/admin/approvals/route';
import { POST as approveUser } from '@/app/api/admin/approvals/[id]/approve/route';
import { POST as rejectUser } from '@/app/api/admin/approvals/[id]/reject/route';

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

// Mock Approval Service
vi.mock('@/features/admin/services/approval-service', () => ({
  ApprovalService: vi.fn().mockImplementation(() => ({
    getPendingApprovals: vi.fn(),
    approveUser: vi.fn(),
    rejectUser: vi.fn(),
  })),
}));

import { verifyToken } from '@/lib/auth/jwt';
import { ApprovalService } from '@/features/admin/services/approval-service';

describe('GET /api/admin/approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/approvals', {
      method: 'GET',
    });

    const response = await listApprovals(request);
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

    const request = new NextRequest('http://localhost:3000/api/admin/approvals', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const response = await listApprovals(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should list pending approvals successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockApprovals = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockGetPending = vi.fn().mockResolvedValue(mockApprovals);

    vi.mocked(ApprovalService).mockImplementation(() => ({
      getPendingApprovals: mockGetPending,
      approveUser: vi.fn(),
      rejectUser: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/approvals', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await listApprovals(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.approvals).toEqual(mockApprovals);
  });
});

describe('POST /api/admin/approvals/:id/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/approve', {
      method: 'POST',
    });

    const response = await approveUser(request, { params: { id: 'user-1' } });
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

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const response = await approveUser(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should approve user successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockApprovedUser = {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User 1',
      approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockApprove = vi.fn().mockResolvedValue(mockApprovedUser);

    vi.mocked(ApprovalService).mockImplementation(() => ({
      getPendingApprovals: vi.fn(),
      approveUser: mockApprove,
      rejectUser: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await approveUser(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.approval).toEqual(mockApprovedUser);
    expect(mockApprove).toHaveBeenCalledWith('user-1');
  });

  it('should return 404 if user not found', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockApprove = vi.fn().mockRejectedValue(new Error('User not found'));

    vi.mocked(ApprovalService).mockImplementation(() => ({
      getPendingApprovals: vi.fn(),
      approveUser: mockApprove,
      rejectUser: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/invalid-id/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await approveUser(request, { params: { id: 'invalid-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});

describe('POST /api/admin/approvals/:id/reject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/reject', {
      method: 'POST',
    });

    const response = await rejectUser(request, { params: { id: 'user-1' } });
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

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/reject', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ reason: 'Test reason' }),
    });

    const response = await rejectUser(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should return 400 if reason is missing', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/reject', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({}),
    });

    const response = await rejectUser(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('reason');
  });

  it('should reject user successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockRejectedUser = {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User 1',
      approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockReject = vi.fn().mockResolvedValue(mockRejectedUser);

    vi.mocked(ApprovalService).mockImplementation(() => ({
      getPendingApprovals: vi.fn(),
      approveUser: vi.fn(),
      rejectUser: mockReject,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/user-1/reject', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ reason: 'Invalid credentials' }),
    });

    const response = await rejectUser(request, { params: { id: 'user-1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.approval).toEqual(mockRejectedUser);
    expect(mockReject).toHaveBeenCalledWith('user-1', 'Invalid credentials');
  });

  it('should return 404 if user not found', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockReject = vi.fn().mockRejectedValue(new Error('User not found'));

    vi.mocked(ApprovalService).mockImplementation(() => ({
      getPendingApprovals: vi.fn(),
      approveUser: vi.fn(),
      rejectUser: mockReject,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/approvals/invalid-id/reject', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({ reason: 'Test reason' }),
    });

    const response = await rejectUser(request, { params: { id: 'invalid-id' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});
