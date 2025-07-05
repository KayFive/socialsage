// src/app/api/auth/instagram/token/route.ts - Fixed with dynamic redirect URI

import { NextRequest, NextResponse } from 'next/server'

// Helper function to determine the correct redirect URI (SAME logic as auth.ts)
function getRedirectUri(request: NextRequest): string {
  // Get the host from the request headers
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  
  console.log('🔍 Token Exchange - Host Detection:')
  console.log('- Host:', host)
  console.log('- Protocol:', protocol)
  console.log('- User-Agent:', request.headers.get('user-agent')?.substring(0, 50))
  
  // If we're on Vercel production
  if (host?.includes('vercel.app') || host?.includes('socialsage-app')) {
    const redirectUri = 'https://socialsage-app.vercel.app/auth/instagram/callback'
    console.log('✅ Using Vercel production redirect URI:', redirectUri)
    return redirectUri
  }
  
  // If we're on ngrok
  if (host?.includes('ngrok')) {
    const redirectUri = `${protocol}://${host}/auth/instagram/callback`
    console.log('🔧 Using ngrok redirect URI:', redirectUri)
    return redirectUri
  }
  
  // If we're on localhost, check environment variable
  if (host?.includes('localhost')) {
    const envRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI
    if (envRedirectUri && envRedirectUri.includes('ngrok')) {
      console.log('🔧 Using ngrok URI from env for localhost:', envRedirectUri)
      return envRedirectUri
    }
  }
  
  // Fallback: try environment variable
  const envRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI
  if (envRedirectUri) {
    console.log('📝 Using environment redirect URI:', envRedirectUri)
    return envRedirectUri
  }
  
  // Final fallback to production
  const fallbackUri = 'https://socialsage-app.vercel.app/auth/instagram/callback'
  console.log('⚠️ Using production fallback redirect URI:', fallbackUri)
  return fallbackUri
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    console.log('🔄 Exchanging Instagram Business API code for token...')

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET
    
    // ✅ FIXED: Use dynamic redirect URI (same logic as auth.ts)
    const redirectUri = getRedirectUri(request)
    
    if (!clientId || !clientSecret) {
      console.error('❌ Missing Instagram credentials')
      return NextResponse.json({ error: 'Instagram credentials not configured' }, { status: 500 })
    }

    console.log('🔧 Token Exchange Configuration:')
    console.log('- Client ID:', clientId)
    console.log('- Redirect URI:', redirectUri)
    console.log('- Client Secret:', clientSecret ? '✅ Set' : '❌ Missing')

    console.log('📡 Making token exchange request...')

    // Exchange code for token using Instagram Business API
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri, // ✅ Now uses dynamic URI
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Instagram Business API token exchange failed:', tokenResponse.status, errorText)
      return NextResponse.json({ 
        error: 'Failed to exchange code for token', 
        details: errorText 
      }, { status: tokenResponse.status })
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Instagram Business API token received:', tokenData)

    // The Business API returns data in this format:
    // { "data": [{ "access_token": "...", "user_id": "...", "permissions": "..." }] }
    let accessToken, userId, permissions

    if (tokenData.data && Array.isArray(tokenData.data) && tokenData.data.length > 0) {
      // New Business API format
      accessToken = tokenData.data[0].access_token
      userId = tokenData.data[0].user_id
      permissions = tokenData.data[0].permissions
      console.log('📊 Using Business API format')
    } else {
      // Fallback to old format
      accessToken = tokenData.access_token
      userId = tokenData.user_id
      permissions = tokenData.permissions
      console.log('📊 Using fallback format')
    }

    if (!accessToken || !userId) {
      console.error('❌ Invalid token response format:', tokenData)
      return NextResponse.json({ 
        error: 'Invalid token response', 
        details: 'Missing access_token or user_id',
        response: tokenData 
      }, { status: 500 })
    }

    console.log('🔍 Getting user profile with Business API...')

    // Get user profile information using Business API
    // Try different endpoints based on what's available
    let profileData = null
    
    // Try method 1: Basic user info
    try {
      const profileResponse = await fetch(
        `https://graph.instagram.com/${userId}?fields=id,username,account_type&access_token=${accessToken}`
      )

      if (profileResponse.ok) {
        profileData = await profileResponse.json()
        console.log('✅ Instagram Business profile data received:', profileData)
      } else {
        const errorText = await profileResponse.text()
        console.log('⚠️ Method 1 failed, error:', errorText)
      }
    } catch (error) {
      console.log('⚠️ Method 1 error:', error)
    }

    // Try method 2: Use /me endpoint if method 1 failed
    if (!profileData) {
      try {
        const profileResponse = await fetch(
          `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
        )

        if (profileResponse.ok) {
          profileData = await profileResponse.json()
          console.log('✅ Instagram /me profile data received:', profileData)
        } else {
          const errorText = await profileResponse.text()
          console.log('⚠️ Method 2 failed, error:', errorText)
        }
      } catch (error) {
        console.log('⚠️ Method 2 error:', error)
      }
    }

    // If we still don't have profile data, use what we have from the token response
    if (!profileData) {
      console.log('⚠️ Could not get profile data, using token response data')
      profileData = {
        id: userId,
        username: 'unknown',
        account_type: 'BUSINESS'
      }
    }

    console.log('🔄 Attempting to get long-lived token...')

    // Exchange for long-lived token
    let finalToken = accessToken
    let expiresIn = 3600 // 1 hour default

    try {
      const longLivedTokenResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`
      )

      if (longLivedTokenResponse.ok) {
        const longLivedData = await longLivedTokenResponse.json()
        finalToken = longLivedData.access_token
        expiresIn = longLivedData.expires_in || 5184000 // 60 days
        console.log('✅ Long-lived Business API token received')
      } else {
        const errorText = await longLivedTokenResponse.text()
        console.log('⚠️ Long-lived token exchange failed:', errorText)
      }
    } catch (error) {
      console.log('⚠️ Long-lived token exchange error:', error)
    }

    const response = {
      access_token: finalToken,
      expires_in: expiresIn,
      user_id: profileData.id,
      username: profileData.username,
      account_type: profileData.account_type || 'BUSINESS',
      permissions: permissions
    }

    console.log('✅ Final token exchange response:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Instagram Business API token exchange error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
    }, { status: 500 })
  }
}