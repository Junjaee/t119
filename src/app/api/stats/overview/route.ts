// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/app/api/stats/stats-api.test.ts
// TAG-003: GET /api/stats/overview - 전체 통계 개요

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { fetchOverviewStats, validateDateRange } from '@/lib/stats/stats-service';
import type { StatsFilters } from '@/types/stats.types';

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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const filters: StatsFilters = {};

    if (startDate) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        return NextResponse.json(
          { error: 'Invalid start_date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      filters.start_date = startDate;
    }

    if (endDate) {
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return NextResponse.json(
          { error: 'Invalid end_date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      filters.end_date = endDate;
    }

    // 4. Validate date range
    try {
      validateDateRange(filters);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid date range' },
        { status: 400 }
      );
    }

    // 5. Fetch stats
    const stats = await fetchOverviewStats(filters);

    // 6. Return response with cache headers
    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/stats/overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
