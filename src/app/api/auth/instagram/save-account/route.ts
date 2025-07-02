import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Save Instagram account API called')

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError)
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { userId, accountData } = await request.json()

    if (!userId || !accountData) {
      return NextResponse.json({ error: 'Missing userId or accountData' }, { status: 400 })
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 })
    }

    // 🔥 FIX 1: Find existing account by MULTIPLE criteria to catch all variations
    console.log('🔍 Looking for existing Instagram accounts...')
    
    const { data: existingAccounts } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', user.id)
      .or(`instagram_id.eq.${accountData.user_id || accountData.id},username.eq.${accountData.username}`)
      .order('created_at', { ascending: true }) // Oldest first

    console.log(`📊 Found ${existingAccounts?.length || 0} existing accounts for user`)

    let primaryAccount = null

    if (existingAccounts && existingAccounts.length > 0) {
      // 🔥 FIX 2: Use the OLDEST account as primary (has most historical data)
      primaryAccount = existingAccounts[0]
      console.log(`✅ Using primary account from ${primaryAccount.created_at}`)

      // 🔥 FIX 3: Deactivate ALL other accounts to prevent conflicts
      if (existingAccounts.length > 1) {
        console.log(`🔄 Deactivating ${existingAccounts.length - 1} duplicate accounts...`)
        
        const duplicateIds = existingAccounts.slice(1).map(acc => acc.id)
        await supabase
          .from('instagram_accounts')
          .update({ is_active: false })
          .in('id', duplicateIds)

        console.log('✅ Duplicate accounts deactivated')
      }

      // Update the primary account with fresh token
      const { data, error: updateError } = await supabase
        .from('instagram_accounts')
        .update({
          access_token: accountData.access_token,
          instagram_id: accountData.user_id || accountData.id, // Ensure consistent ID
          username: accountData.username,
          instagram_handle: accountData.username,
          is_active: true,
          updated_at: new Date().toISOString(),
          token_expires_at: accountData.expires_in 
            ? new Date(Date.now() + accountData.expires_in * 1000).toISOString()
            : undefined
        })
        .eq('id', primaryAccount.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating primary account:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update Instagram account',
          details: updateError.message 
        }, { status: 500 })
      }

      console.log('✅ Primary Instagram account updated with historical data preserved')
      return NextResponse.json({ success: true, account: data })

    } else {
      // Create new account (first time)
      console.log('📊 Creating new Instagram account record')
      
      // First deactivate any other active accounts for this user
      await supabase
        .from('instagram_accounts')
        .update({ is_active: false })
        .eq('user_id', userId)

      const instagramAccountData = {
        user_id: user.id,
        instagram_id: accountData.user_id || accountData.id,
        instagram_handle: accountData.username || 'unknown',
        username: accountData.username || 'unknown',
        access_token: accountData.access_token,
        is_active: true,
        account_type: accountData.account_type || 'BUSINESS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        token_expires_at: accountData.expires_in 
          ? new Date(Date.now() + accountData.expires_in * 1000).toISOString()
          : undefined
      }

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

      console.log('✅ New Instagram account created')
      return NextResponse.json({ success: true, account: data })
    }

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