// @CODE:ADMIN-001:DOMAIN | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/features/admin/services/association-service.test.ts

/**
 * Association Service
 *
 * @description
 * Business logic for admin association management.
 * - CRUD operations with soft delete
 * - 10 association limit per admin (C-002)
 * - Auto-initialization: is_public=true, creator as admin member (ER-001)
 *
 * @spec SPEC-ADMIN-001
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Association,
  CreateAssociationDTO,
  UpdateAssociationDTO,
  AssociationListFilters,
  AssociationListResponse,
} from '@/types/admin.types';

interface ServiceResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class AssociationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create new association
   * - Validates name length (2-50 chars) - C-001
   * - Validates description length (max 500 chars)
   * - Enforces 10 association limit per admin - C-002
   * - Sets default values: is_public=true, is_deleted=false - ER-001
   * - Creates association member with admin role - ER-001
   */
  async create(
    dto: CreateAssociationDTO,
    createdBy: string
  ): Promise<ServiceResponse<Association>> {
    // Validate name length (2-50 chars) - C-001
    if (dto.name.length < 2 || dto.name.length > 50) {
      return {
        error: {
          code: 'INVALID_NAME_LENGTH',
          message: '협회명은 2자 이상 50자 이하여야 합니다',
        },
      };
    }

    // Validate description length (max 500 chars)
    if (dto.description && dto.description.length > 500) {
      return {
        error: {
          code: 'INVALID_DESCRIPTION_LENGTH',
          message: '설명은 500자 이하여야 합니다',
        },
      };
    }

    // Check 10 association limit per admin - C-002
    const count = await this.countByAdmin(createdBy);
    if (count >= 10) {
      return {
        error: {
          code: 'ASSOCIATION_LIMIT_EXCEEDED',
          message: '한 관리자는 최대 10개 협회까지 관리할 수 있습니다',
        },
      };
    }

    // Create association with default values
    const { data, error } = await this.supabase
      .from('associations')
      .insert({
        name: dto.name,
        region: dto.region,
        description: dto.description,
        logo_url: dto.logo_url,
        is_public: true, // Default: true - ER-001
        is_deleted: false, // Default: false
        created_by: createdBy,
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

    // Create association member with admin role - ER-001
    await this.supabase.from('association_members').insert({
      association_id: data.id,
      user_id: createdBy,
      role: 'admin',
    });

    return { data };
  }

  /**
   * List associations with pagination and filters
   * - Supports region filter
   * - Supports is_deleted filter
   * - Default: page=1, limit=20
   */
  async list(
    filters: AssociationListFilters
  ): Promise<ServiceResponse<AssociationListResponse>> {
    const { page = 1, limit = 20, region, is_deleted = false } = filters;

    let query = this.supabase
      .from('associations')
      .select('*', { count: 'exact' })
      .eq('is_deleted', is_deleted);

    // Apply region filter
    if (region) {
      query = query.eq('region', region);
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
        associations: data || [],
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
   * Get association by ID
   */
  async getById(id: string): Promise<ServiceResponse<Association>> {
    const { data, error } = await this.supabase
      .from('associations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: '협회를 찾을 수 없습니다',
        },
      };
    }

    return { data };
  }

  /**
   * Update association
   * - Validates name length (2-50 chars) if provided
   * - Validates description length (max 500 chars) if provided
   */
  async update(
    id: string,
    dto: UpdateAssociationDTO
  ): Promise<ServiceResponse<Association>> {
    // Validate name length if provided
    if (dto.name && (dto.name.length < 2 || dto.name.length > 50)) {
      return {
        error: {
          code: 'INVALID_NAME_LENGTH',
          message: '협회명은 2자 이상 50자 이하여야 합니다',
        },
      };
    }

    // Validate description length if provided
    if (dto.description && dto.description.length > 500) {
      return {
        error: {
          code: 'INVALID_DESCRIPTION_LENGTH',
          message: '설명은 500자 이하여야 합니다',
        },
      };
    }

    const { data, error } = await this.supabase
      .from('associations')
      .update(dto)
      .eq('id', id)
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

  /**
   * Soft delete association - C-004
   * - Sets is_deleted=true (does not permanently delete)
   */
  async delete(id: string): Promise<ServiceResponse<Association>> {
    const { data, error } = await this.supabase
      .from('associations')
      .update({ is_deleted: true })
      .eq('id', id)
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

  /**
   * Count active associations by admin
   * - Used for 10 association limit check - C-002
   */
  async countByAdmin(createdBy: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('associations')
      .select('id')
      .eq('created_by', createdBy)
      .eq('is_deleted', false);

    if (error) {
      return 0;
    }

    return data?.length || 0;
  }
}
