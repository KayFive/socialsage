import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔌 Instagram disconnect API called')

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

    const { userId } = await request.json()

    if (!userId) {
      console.error('❌ Missing userId')
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user || user.id !== userId) {
      console.log('❌ Unauthorized disconnect attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 Deactivating Instagram accounts for user:', userId)

    // Mark all Instagram accounts as inactive for this user
    const { error: updateError } = await supabase
      .from('instagram_accounts')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('❌ Error deactivating Instagram accounts:', updateError)
      return NextResponse.json({ 
        error: 'Failed to disconnect Instagram account',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Instagram accounts deactivated successfully')

    return NextResponse.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    })

  } catch (error) {
    console.error('❌ Instagram disconnect error:', error)
    return NextResponse.json({ 
      error: 'Failed to disconnect Instagram account',
      details: typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : String(error)
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'