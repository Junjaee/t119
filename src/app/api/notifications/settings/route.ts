// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-008
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Settings update schema
const settingsUpdateSchema = z.object({
  email_enabled: z.boolean().optional(),
  realtime_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  counselor_assigned: z.boolean().optional(),
  new_message: z.boolean().optional(),
  status_changed: z.boolean().optional(),
  reminder: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

/**
 * GET /api/notifications/settings
 * Get user notification settings
 */
export async function GET() {
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

    // Get settings
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If settings don't exist, create default settings
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          email_enabled: true,
          realtime_enabled: true,
          sms_enabled: false,
          counselor_assigned: true,
          new_message: true,
          status_changed: true,
          reminder: true,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create settings: ${createError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ settings: newSettings });
    }

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch settings: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/settings
 * Update user notification settings
 */
export async function PATCH(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const updates = settingsUpdateSchema.parse(body);

    // Update settings
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    // If settings don't exist, create them
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          ...updates,
          email_enabled: updates.email_enabled ?? true,
          realtime_enabled: updates.realtime_enabled ?? true,
          sms_enabled: updates.sms_enabled ?? false,
          counselor_assigned: updates.counselor_assigned ?? true,
          new_message: updates.new_message ?? true,
          status_changed: updates.status_changed ?? true,
          reminder: updates.reminder ?? true,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create settings: ${createError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ settings: newSettings });
    }

    if (error) {
      return NextResponse.json(
        { error: `Failed to update settings: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
