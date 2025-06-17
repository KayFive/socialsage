// src/lib/supabase.ts - Browser-only Supabase client
import { createBrowserClient } from '@supabase/ssr'

// Create and export the browser client
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Export as default too for compatibility
export default supabase