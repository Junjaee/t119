// @CODE:INFRA-001:ADMIN | SPEC: .moai/specs/SPEC-INFRA-001/spec.md | TEST: tests/lib/supabase/admin.test.ts

/**
 * Supabase Admin Client
 *
 * @description
 * Creates a Supabase client with service role privileges.
 * BYPASSES Row Level Security (RLS) policies.
 * ONLY use in trusted server-side code (API routes, server actions).
 *
 * @security
 * - NEVER expose service role key to client
 * - NEVER import this in client components
 * - Always validate user permissions before using admin client
 *
 * @usage
 * ```tsx
 * // API Route Handler
 * import { createAdminClient } from '@/lib/supabase/admin';
 *
 * export async function POST(request: Request) {
 *   const admin = createAdminClient();
 *   // Admin operations...
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

/**
 * Creates or returns existing Supabase admin client (singleton pattern)
 *
 * @returns Supabase admin client instance with service role privileges
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing
 *
 * @warning This client BYPASSES RLS policies. Use with extreme caution.
 */
export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

/**
 * Gets the current Supabase admin client instance
 *
 * @returns Supabase admin client or undefined if not initialized
 */
export function getAdminClient() {
  return adminClient;
}

/**
 * Resets the Supabase admin client (useful for testing)
 */
export function resetAdminClient() {
  adminClient = undefined;
}
