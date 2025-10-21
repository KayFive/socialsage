import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Server-side Instagram OAuth callback started')
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    if (error) {
      console.error('❌ Instagram OAuth error:', error)
      return NextResponse.redirect(new URL(`/?error=oauth_cancelled&message=${error}`, request.url))
    }
    
    if (!code || !state) {
      console.error('❌ Missing OAuth parameters')
      return NextResponse.redirect(new URL('/?error=oauth_invalid&message=Missing authorization code or state', request.url))
    }
    
    // Extract user ID from state parameter (this is reliable)
    const userId = state.split('_USER_')[1]
    if (!userId) {
      console.error('❌ Invalid state parameter')
      return NextResponse.redirect(new URL('/?error=oauth_invalid&message=Invalid state parameter', request.url))
    }
    
    console.log('✅ Found user ID from state:', userId)
    
    // Exchange code for token using your existing token route
    console.log('🔄 Exchanging code for token...')
    const tokenResponse = await fetch(`${request.nextUrl.origin}/api/auth/instagram/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state })
    })
    
    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokenResponse.status)
      return NextResponse.redirect(new URL('/?error=token_exchange_failed&message=Failed to exchange authorization code', request.url))
    }
    
    const tokenData = await tokenResponse.json()
    console.log('✅ Token received:', !!tokenData.access_token)
    
    // Save account directly using user ID from state (no session dependency)
    console.log('💾 Saving Instagram account...')
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) { cookieStore.set(name, value, options) },
          remove(name: string, options: any) { cookieStore.delete(name) }
        }
      }
    )
    
    // First, deactivate all existing Instagram accounts for this user
    await supabase
      .from('instagram_accounts')
      .update({ is_active: false })
      .eq('user_id', userId)
    
    // Then upsert the new/updated account
    const { error: saveError } = await supabase
      .from('instagram_accounts')
      .upsert({
        user_id: userId,
        instagram_id: tokenData.user_id,
        instagram_handle: tokenData.username,
        username: tokenData.username,
        access_token: tokenData.access_token,
        account_type: tokenData.account_type || 'BUSINESS',
        permissions: tokenData.permissions || [],
        token_expires_at: tokenData.expires_in ? 
          new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : 
          null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,instagram_id',
        ignoreDuplicates: false
      })
    
    if (saveError) {
      console.error('❌ Failed to save Instagram account:', saveError)
      return NextResponse.redirect(new URL('/?error=save_failed&message=Failed to save Instagram account', request.url))
    }
    
    console.log('✅ Instagram account saved successfully')
    
    // Success - redirect back to app with success indicator
    return NextResponse.redirect(new URL('/?instagram=connected&message=Instagram connected successfully', request.url))
    
  } catch (error) {
    console.error('❌ Callback handler error:', error)
    return NextResponse.redirect(new URL('/?error=callback_failed&message=OAuth callback failed', request.url))
  }
}