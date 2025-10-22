// @CODE:ADMIN-001:API | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/app/api/admin/dashboard.test.ts
// TAG-009: GET /api/admin/dashboard - Dashboard statistics

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { DashboardService } from '@/features/admin/services/dashboard-service';
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

    // 3. Get dashboard data via service
    const supabase = await createClient();
    const service = new DashboardService(supabase);

    const [overview, recent_activities, alerts] = await Promise.all([
      service.getOverviewStats(),
      service.getRecentActivities(),
      service.getAlerts(),
    ]);

    // 4. Return dashboard data with cache (P-003: 500ms target)
    return NextResponse.json(
      {
        overview,
        recent_activities,
        alerts,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
