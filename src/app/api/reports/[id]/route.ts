// @CODE:REPORT-001:API | SPEC: .moai/specs/SPEC-REPORT-001/spec.md
// 신고 상세 API: GET/PATCH/DELETE /api/reports/[id]

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateReportSchema } from '@/lib/validators/report.validator';
import {
  getReportById,
  updateReport,
  deleteReport,
} from '@/lib/reports/report-service';

/**
 * GET /api/reports/[id] - 신고 상세 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;
    const report = await getReportById(supabase, reportId, userId);

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reports/[id] - 신고 업데이트
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const reportId = params.id;
    const report = await updateReport(supabase, reportId, userId, validation.data);

    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error('Failed to update report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id] - 신고 삭제
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;
    await deleteReport(supabase, reportId, userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
