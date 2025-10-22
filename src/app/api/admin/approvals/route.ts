// @CODE:ADMIN-001:API | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/app/api/admin/approvals.test.ts
// TAG-008: GET /api/admin/approvals - List approval queue

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { ApprovalService } from '@/features/admin/services/approval-service';
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

    // 3. Get pending approvals via service
    const supabase = await createClient();
    const service = new ApprovalService(supabase);

    const approvals = await service.getPendingApprovals();

    // 4. Return approvals list
    return NextResponse.json(
      { approvals },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/admin/approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
