// @TEST:ADMIN-001 | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md
// TAG-007: Association APIs Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createAssociation } from '@/app/api/admin/associations/route';
import { GET as listAssociations } from '@/app/api/admin/associations/route';
import { PATCH as updateAssociation } from '@/app/api/admin/associations/[id]/route';
import { DELETE as deleteAssociation } from '@/app/api/admin/associations/[id]/route';

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

// Mock Association Service
vi.mock('@/features/admin/services/association-service', () => ({
  AssociationService: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { verifyToken } from '@/lib/auth/jwt';
import { AssociationService } from '@/features/admin/services/association-service';

describe('POST /api/admin/associations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {},
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if invalid token', async () => {
    vi.mocked(verifyToken).mockReturnValue(null);

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid token');
  });

  it('should return 403 if user is not admin', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'user@example.com',
      role: 'user',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        name: 'Test Association',
        region: 'Seoul',
        description: 'Test description',
      }),
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should return 400 if name is missing', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({
        region: 'Seoul',
        description: 'Test description',
      }),
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name');
  });

  it('should return 400 if region is missing', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({
        name: 'Test Association',
        description: 'Test description',
      }),
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('region');
  });

  it('should return 400 if description is missing', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({
        name: 'Test Association',
        region: 'Seoul',
      }),
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('description');
  });

  it('should return 400 if 10 association limit exceeded', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockCreate = vi.fn().mockResolvedValue({
      error: {
        code: 'ASSOCIATION_LIMIT_EXCEEDED',
        message: '한 관리자는 최대 10개 협회까지 관리할 수 있습니다',
      },
    });

    vi.mocked(AssociationService).mockImplementation(() => ({
      create: mockCreate,
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({
        name: 'Test Association',
        region: 'Seoul',
        description: 'Test description',
      }),
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('10개');
  });

  it('should create association successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockAssociation = {
      id: 'assoc-123',
      name: 'Test Association',
      region: 'Seoul',
      description: 'Test description',
      logo_url: null,
      is_public: true,
      is_deleted: false,
      created_by: 'admin-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockCreate = vi.fn().mockResolvedValue({
      data: mockAssociation,
    });

    vi.mocked(AssociationService).mockImplementation(() => ({
      create: mockCreate,
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({
        name: 'Test Association',
        region: 'Seoul',
        description: 'Test description',
      }),
    });

    const response = await createAssociation(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.association).toEqual(mockAssociation);
    expect(mockCreate).toHaveBeenCalledWith(
      {
        name: 'Test Association',
        region: 'Seoul',
        description: 'Test description',
      },
      'admin-123'
    );
  });
});

describe('GET /api/admin/associations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'GET',
    });

    const response = await listAssociations(request);
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

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const response = await listAssociations(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Forbidden');
  });

  it('should list associations with default pagination', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockAssociations = [
      {
        id: 'assoc-1',
        name: 'Association 1',
        region: 'Seoul',
        description: 'Description 1',
        logo_url: null,
        is_public: true,
        is_deleted: false,
        created_by: 'admin-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const mockList = vi.fn().mockResolvedValue({
      data: {
        associations: mockAssociations,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
        },
      },
    });

    vi.mocked(AssociationService).mockImplementation(() => ({
      create: vi.fn(),
      list: mockList,
      update: vi.fn(),
      delete: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/associations', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await listAssociations(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.associations).toEqual(mockAssociations);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    });
  });

  it('should filter associations by region', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockList = vi.fn().mockResolvedValue({
      data: {
        associations: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
      },
    });

    vi.mocked(AssociationService).mockImplementation(() => ({
      create: vi.fn(),
      list: mockList,
      update: vi.fn(),
      delete: vi.fn(),
    }));

    const request = new NextRequest(
      'http://localhost:3000/api/admin/associations?region=Seoul',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer admin-token',
        },
      }
    );

    const response = await listAssociations(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      region: 'Seoul',
      is_deleted: false,
    });
  });
});

describe('PATCH /api/admin/associations/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/associations/assoc-123', {
      method: 'PATCH',
    });

    const response = await updateAssociation(request, { params: { id: 'assoc-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should update association successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockUpdated = {
      id: 'assoc-123',
      name: 'Updated Association',
      region: 'Seoul',
      description: 'Updated description',
      logo_url: null,
      is_public: false,
      is_deleted: false,
      created_by: 'admin-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockUpdate = vi.fn().mockResolvedValue({
      data: mockUpdated,
    });

    vi.mocked(AssociationService).mockImplementation(() => ({
      create: vi.fn(),
      list: vi.fn(),
      update: mockUpdate,
      delete: vi.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/associations/assoc-123', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer admin-token',
      },
      body: JSON.stringify({
        name: 'Updated Association',
        is_public: false,
      }),
    });

    const response = await updateAssociation(request, { params: { id: 'assoc-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.association).toEqual(mockUpdated);
  });
});

describe('DELETE /api/admin/associations/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/associations/assoc-123', {
      method: 'DELETE',
    });

    const response = await deleteAssociation(request, { params: { id: 'assoc-123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should soft delete association successfully', async () => {
    vi.mocked(verifyToken).mockReturnValue({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
    });

    const mockDeleted = {
      id: 'assoc-123',
      name: 'Test Association',
      region: 'Seoul',
      description: 'Test description',
      logo_url: null,
      is_public: true,
      is_deleted: true,
      created_by: 'admin-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockDelete = vi.fn().mockResolvedValue({
      data: mockDeleted,
    });

    vi.mocked(AssociationService).mockImplementation(() => ({
      create: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: mockDelete,
    }));

    const request = new NextRequest('http://localhost:3000/api/admin/associations/assoc-123', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer admin-token',
      },
    });

    const response = await deleteAssociation(request, { params: { id: 'assoc-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.association.is_deleted).toBe(true);
  });
});
