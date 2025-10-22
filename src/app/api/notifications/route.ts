// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-007
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Query parameter schema
const notificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  is_read: z.enum(['true', 'false']).optional(),
  category: z.enum(['counselor_assigned', 'new_message', 'status_changed', 'reminder']).optional(),
});

/**
 * GET /api/notifications
 * List user notifications with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = notificationsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      is_read: searchParams.get('is_read') || undefined,
      category: searchParams.get('category') || undefined,
    });

    const offset = (params.page - 1) * params.limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (params.is_read !== undefined) {
      query = query.eq('is_read', params.is_read === 'true');
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Execute query with pagination
    const { data: notifications, error, count } = await query
      .range(offset, offset + params.limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch notifications: ${error.message}` },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    // Return response
    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / params.limit),
      },
      unread_count: unreadCount || 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
