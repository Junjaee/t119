// @CODE:ADMIN-001:API | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/app/api/admin/audit-logs.test.ts
// TAG-010: GET /api/admin/audit-logs - List audit logs

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { AuditLogService } from '@/features/admin/services/audit-log-service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Authorization check (admin only)
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const start_date = searchParams.get('start_date') || undefined;
    const end_date = searchParams.get('end_date') || undefined;
    const action = searchParams.get('action') || undefined;
    const user_id = searchParams.get('user_id') || undefined;

    // 4. List audit logs via service
    const supabase = await createClient();
    const service = new AuditLogService(supabase);

    const result = await service.list({
      page,
      limit,
      start_date,
      end_date,
      action,
      user_id,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    // 5. Return logs with pagination
    return NextResponse.json(
      {
        logs: result.data!.logs,
        pagination: result.data!.pagination,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
