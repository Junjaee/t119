// @CODE:INFRA-001:SERVER | SPEC: .moai/specs/SPEC-INFRA-001/spec.md | TEST: tests/lib/supabase/server.test.ts

/**
 * Supabase Server Client
 *
 * @description
 * Creates a Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Integrates with Next.js cookies for session management.
 *
 * @usage
 * ```tsx
 * import { createClient } from '@/lib/supabase/server';
 *
 * export default async function ServerComponent() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('users').select();
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Creates a Supabase client for server-side operations
 *
 * @returns Promise resolving to Supabase client instance
 * @throws Error if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
