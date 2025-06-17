import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Save Instagram account API called')

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

    const { userId, accountData } = await request.json()

    if (!userId || !accountData) {
      console.error('❌ Missing required data:', { userId: !!userId, accountData: !!accountData })
      return NextResponse.json({ error: 'Missing userId or accountData' }, { status: 400 })
    }

    console.log('📊 Processing account data for user:', userId)

    // Deactivate any existing Instagram accounts for this user
    const { error: deactivateError } = await supabase
      .from('instagram_accounts')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (deactivateError) {
      console.error('❌ Error deactivating existing accounts:', deactivateError)
      // Continue anyway, as this might be the first account
    }

    // Prepare the account data
    const instagramAccountData = {
      user_id: userId,
      instagram_id: accountData.user_id || accountData.id,
      username: accountData.username,
      access_token: accountData.access_token,
      token_type: accountData.token_type || 'bearer',
      is_active: true,
      token_expires_at: accountData.expires_in 
        ? new Date(Date.now() + accountData.expires_in * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 Saving Instagram account data:', {
      userId: instagramAccountData.user_id,
      instagramId: instagramAccountData.instagram_id,
      username: instagramAccountData.username,
      hasAccessToken: !!instagramAccountData.access_token
    })

    // Insert the new account
    const { data: savedAccount, error: insertError } = await supabase
      .from('instagram_accounts')
      .insert(instagramAccountData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error saving Instagram account:', insertError)
      return NextResponse.json({ 
        error: 'Failed to save Instagram account',
        details: insertError.message 
      }, { status: 500 })
    }

    console.log('✅ Instagram account saved successfully:', savedAccount.id)

    return NextResponse.json({
      success: true,
      account: savedAccount
    })

  } catch (error) {
    console.error('❌ Save Instagram account error:', error)
    return NextResponse.json({ 
      error: 'Failed to save Instagram account',
      details: typeof error === 'object' && error !== null && 'message' in error 
        ? (error as { message: string }).message 
        : String(error)
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'