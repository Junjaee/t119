// @CODE:INFRA-001:CLIENT | SPEC: .moai/specs/SPEC-INFRA-001/spec.md | TEST: tests/lib/supabase/client.test.ts

/**
 * Supabase Browser Client
 *
 * @description
 * Creates a Supabase client for use in browser/client-side React components.
 * Uses anon key and respects Row Level Security (RLS) policies.
 *
 * @usage
 * ```tsx
 * import { createClient } from '@/lib/supabase/client';
 *
 * export default function Component() {
 *   const supabase = createClient();
 *   // Use supabase client...
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Creates or returns existing Supabase browser client (singleton pattern)
 *
 * @returns Supabase client instance
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing
 */
export function createClient() {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return client;
}

/**
 * Gets the current Supabase client instance
 *
 * @returns Supabase client or undefined if not initialized
 */
export function getClient() {
  return client;
}

/**
 * Resets the Supabase client (useful for testing)
 */
export function resetClient() {
  client = undefined;
}
