// File: src/app/api/test-instagram/route.ts
// Test Instagram API connection with detailed debugging

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient();
    
    console.log('🔍 Testing Instagram connection...');
    
    // First, let's see what we get
    const { data: accounts, error: accountsError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('is_active', true);
      
    if (accountsError) {
      console.error('❌ Failed to fetch accounts:', accountsError);
      return NextResponse.json({ 
        error: 'Failed to fetch accounts',
        details: accountsError,
        message: accountsError.message 
      });
    }
    
    console.log(`📊 Found ${accounts?.length || 0} active accounts`);
    
    if (!accounts || accounts.length === 0) {
      // Let's check all accounts without filter
      const { data: allAccounts, error: allError } = await supabase
        .from('instagram_accounts')
        .select('id, instagram_handle, is_active, user_id');
        
      return NextResponse.json({ 
        error: 'No active accounts found',
        totalAccounts: allAccounts?.length || 0,
        allAccounts: allAccounts?.map(acc => ({
          id: acc.id,
          handle: acc.instagram_handle,
          active: acc.is_active,
          userId: acc.user_id
        })),
        queryError: allError
      });
    }
    
    // Get first active account
    const account = accounts[0];
    console.log(`🔄 Testing with account: ${account.instagram_handle}`);
    
    // Test Instagram API
    const instagramUrl = `https://graph.instagram.com/me?fields=id,username,media_count,followers_count,follows_count&access_token=${account.access_token}`;
    
    console.log('📡 Calling Instagram API...');
    const response = await fetch(instagramUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Instagram API error:', data);
    } else {
      console.log('✅ Instagram API success:', data);
    }
    
    // Also test fetching media
    let mediaData = null;
    if (response.ok) {
      const mediaUrl = `https://graph.instagram.com/me/media?fields=id,media_type,media_url,caption,timestamp&limit=5&access_token=${account.access_token}`;
      const mediaResponse = await fetch(mediaUrl);
      mediaData = await mediaResponse.json();
      console.log(`📸 Found ${mediaData.data?.length || 0} recent posts`);
    }
    
    return NextResponse.json({
      success: response.ok,
      timestamp: new Date().toISOString(),
      accountsFound: accounts.length,
      testedAccount: {
        id: account.id,
        handle: account.instagram_handle,
        userId: account.user_id,
        tokenValid: new Date(account.token_expires_at) > new Date(),
        tokenExpires: account.token_expires_at,
        lastSync: account.last_sync_at
      },
      instagramProfile: data,
      recentPosts: mediaData?.data?.length || 0,
      firstPost: mediaData?.data?.[0] || null,
      status: response.status,
      allActiveAccounts: accounts.map(acc => ({
        id: acc.id,
        handle: acc.instagram_handle,
        userId: acc.user_id
      }))
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}