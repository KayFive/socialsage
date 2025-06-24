import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Create modern Supabase server client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No need to set cookies in API routes
          },
          remove(name: string, options: CookieOptions) {
            // No need to remove cookies in API routes
          },
        },
      }
    )

    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No authenticated user' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    })

  } catch (error) {
    console.error('❌ User API error:', error)
    return NextResponse.json({ 
      error: 'Failed to get user',
      details: typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : String(error)
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'