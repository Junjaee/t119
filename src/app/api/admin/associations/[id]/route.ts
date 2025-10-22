// @CODE:ADMIN-001:API | SPEC: .moai/specs/SPEC-ADMIN-001/spec.md | TEST: tests/app/api/admin/associations.test.ts
// TAG-007: PATCH /api/admin/associations/:id - Update association
// TAG-007: DELETE /api/admin/associations/:id - Soft delete association

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { AssociationService } from '@/features/admin/services/association-service';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
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
    const { name, description, is_public } = body;

    // 4. Update association via service
    const supabase = await createClient();
    const service = new AssociationService(supabase);

    const result = await service.update(params.id, {
      name,
      description,
      is_public,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    // 5. Return updated association
    return NextResponse.json(
      { association: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/admin/associations/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // 3. Soft delete association via service - C-004
    const supabase = await createClient();
    const service = new AssociationService(supabase);

    const result = await service.delete(params.id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    // 4. Return deleted association
    return NextResponse.json(
      { association: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/admin/associations/:id:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
