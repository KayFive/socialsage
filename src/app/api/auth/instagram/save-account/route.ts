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

    // Authenticate the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError)
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log('✅ Authenticated user:', user.id)

    const { userId, accountData } = await request.json()

    if (!userId || !accountData) {
      console.error('❌ Missing required data:', { userId: !!userId, accountData: !!accountData })
      return NextResponse.json({ error: 'Missing userId or accountData' }, { status: 400 })
    }

    // Verify user matches
    if (user.id !== userId) {
      console.error('❌ User ID mismatch:', user.id, 'vs', userId)
      return NextResponse.json(
        { error: 'Unauthorized: User ID mismatch' },
        { status: 403 }
      )
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

    // Prepare the account data - ONLY using fields that exist in your schema
    type InstagramAccountData = {
      user_id: string
      instagram_id: any
      instagram_handle: any
      username: any
      access_token: any
      is_active: boolean
      account_type: any
      created_at: string
      updated_at: string
      token_expires_at?: string
    }

    const instagramAccountData: InstagramAccountData = {
      user_id: user.id,
      instagram_id: accountData.user_id || accountData.id,
      instagram_handle: accountData.username || 'unknown',
      username: accountData.username || 'unknown',
      access_token: accountData.access_token,
      is_active: true,
      account_type: accountData.account_type || 'BUSINESS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Only add token_expires_at if we have expiration data
    if (accountData.expires_in) {
      instagramAccountData.token_expires_at = new Date(Date.now() + accountData.expires_in * 1000).toISOString()
    }

    console.log('💾 Saving Instagram account data:', {
      userId: instagramAccountData.user_id,
      instagramId: instagramAccountData.instagram_id,
      username: instagramAccountData.username,
      instagram_handle: instagramAccountData.instagram_handle,
      hasAccessToken: !!instagramAccountData.access_token,
      accountType: instagramAccountData.account_type
    })

    // ✅ FIXED: Check for existing record first to preserve historical data
    const { data: existingAccount } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('instagram_id', instagramAccountData.instagram_id)
      .maybeSingle()

    let savedAccount;

    if (existingAccount) {
      // ✅ Reactivate existing account (preserves historical data)
      console.log('📊 Reactivating existing Instagram account with historical data')
      const { data, error: updateError } = await supabase
        .from('instagram_accounts')
        .update({
          access_token: instagramAccountData.access_token,
          is_active: true,
          updated_at: new Date().toISOString(),
          token_expires_at: instagramAccountData.token_expires_at
        })
        .eq('id', existingAccount.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error reactivating Instagram account:', updateError)
        return NextResponse.json({ 
          error: 'Failed to reactivate Instagram account',
          details: updateError.message 
        }, { status: 500 })
      }

      savedAccount = data
      console.log('✅ Instagram account reactivated with historical data preserved')

    } else {
      // ✅ Create new account (first time connecting this Instagram account)
      console.log('📊 Creating new Instagram account record')
      const { data, error: insertError } = await supabase
        .from('instagram_accounts')
        .insert(instagramAccountData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error creating Instagram account:', insertError)
        return NextResponse.json({ 
          error: 'Failed to save Instagram account',
          details: insertError.message 
        }, { status: 500 })
      }

      savedAccount = data
      console.log('✅ New Instagram account created')
    }

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