// Health check endpoint for Supabase connection testing
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Test 1: Check if client was created
    if (!supabase) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to create Supabase client',
          checks: {
            client: false,
            env: false,
            connection: false,
          },
        },
        { status: 500 }
      );
    }

    // Test 2: Check environment variables
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing environment variables',
          checks: {
            client: true,
            env: false,
            url: hasUrl,
            key: hasKey,
            connection: false,
          },
        },
        { status: 500 }
      );
    }

    // Test 3: Test database connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0);

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connection failed',
          error: error.message,
          checks: {
            client: true,
            env: true,
            connection: false,
          },
        },
        { status: 500 }
      );
    }

    // All checks passed
    return NextResponse.json({
      status: 'ok',
      message: 'All systems operational',
      checks: {
        client: true,
        env: true,
        connection: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unexpected error',
        error: error.message,
        checks: {
          client: false,
          env: false,
          connection: false,
        },
      },
      { status: 500 }
    );
  }
}
