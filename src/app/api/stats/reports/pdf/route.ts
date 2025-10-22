// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/app/api/stats/pdf-api.test.ts
// TAG-007: POST /api/stats/reports/pdf - PDF 리포트 생성

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
  generateStatsReport,
  uploadPDFToStorage,
  generateReportFileName,
} from '@/lib/pdf/pdf-generator';
import { z } from 'zod';

// Request body schema
const PDFRequestSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  include_charts: z.array(z.string()).optional().default([]),
  title: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = PDFRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { start_date, end_date, include_charts, title } = validationResult.data;

    // 4. Generate PDF
    const pdfData = await generateStatsReport({
      start_date,
      end_date,
      include_charts,
      title,
    });

    // 5. Upload to storage
    const fileName = generateReportFileName(start_date, end_date);
    const uploadResult = await uploadPDFToStorage(pdfData, fileName);

    // 6. Return response
    return NextResponse.json(uploadResult, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/stats/reports/pdf:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
