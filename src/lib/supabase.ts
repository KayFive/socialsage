// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance
const singletonClient = createClient(supabaseUrl, supabaseAnonKey);

// Export the singleton client function
export function createBrowserClient() {
  return singletonClient;
}

// For server components if needed
export function createServerClient(cookieStore: any) {
  return createClient(supabaseUrl, supabaseAnonKey);
}