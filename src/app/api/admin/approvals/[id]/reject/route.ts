// @CODE:ADMIN-001:API | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/app/api/admin/approvals.test.ts
// TAG-008: POST /api/admin/approvals/:id/reject - Reject user

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { ApprovalService } from '@/features/admin/services/approval-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 3. Parse request body
    const body = await request.json();
    const { reason } = body;

    // 4. Validate reason is provided
    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    // 5. Reject user via service
    const supabase = await createClient();
    const service = new ApprovalService(supabase);

    try {
      const approval = await service.rejectUser(params.id, reason);

      // 6. Return rejected user
      return NextResponse.json(
        { approval },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in POST /api/admin/approvals/:id/reject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
