// src/app/api/instagram/token/route.ts
// Server-side Instagram token exchange to avoid CORS issues

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing required fields: code and redirectUri' },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID!;
    const clientSecret = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_SECRET!;

    console.log('🔄 Starting token exchange...');
    console.log('   Code:', code.substring(0, 10) + '...');
    console.log('   Redirect URI:', redirectUri);
    console.log('   Client ID:', clientId);

    // Step 1: Exchange code for short-lived token
    const shortLivedResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!shortLivedResponse.ok) {
      const errorData = await shortLivedResponse.text();
      console.error('❌ Short-lived token exchange failed:', errorData);
      
      return NextResponse.json(
        { error: `Token exchange failed: ${errorData}` },
        { status: shortLivedResponse.status }
      );
    }

    const shortLivedData = await shortLivedResponse.json();
    console.log('✅ Short-lived token obtained');

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/v18.0/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedData.access_token}`,
      { method: 'GET' }
    );

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.text();
      console.error('❌ Long-lived token exchange failed:', errorData);
      
      return NextResponse.json(
        { error: `Long-lived token exchange failed: ${errorData}` },
        { status: longLivedResponse.status }
      );
    }

    const longLivedData = await longLivedResponse.json();
    console.log('✅ Long-lived token obtained');

    // Return the long-lived access token
    return NextResponse.json({
      access_token: longLivedData.access_token,
      expires_in: longLivedData.expires_in || 5184000, // 60 days default
    });

  } catch (error) {
    console.error('❌ Token exchange API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error during token exchange' },
      { status: 500 }
    );
  }
}