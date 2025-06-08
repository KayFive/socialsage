import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for API routes
// This ensures consistent database connections in server environments
export function createServerClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false, // Server-side doesn't need session persistence
      },
    }
  );
}

// For consistency, you can also export a singleton instance
let serverSupabase: ReturnType<typeof createServerClient> | null = null;

export function getServerSupabase() {
  if (!serverSupabase) {
    serverSupabase = createServerClient();
  }
  return serverSupabase;
}