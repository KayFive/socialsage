// File: src/app/api/test-instagram/route.ts
// Test Instagram API connection

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get first active account
    const { data: account, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();
      
    if (error || !account) {
      return NextResponse.json({ error: 'No active account found' });
    }
    
    // Test Instagram API
    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,media_count&access_token=${account.access_token}`
    );
    
    const data = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      account: {
        id: account.id,
        handle: account.instagram_handle,
        token_valid: new Date(account.token_expires_at) > new Date()
      },
      instagram_response: data,
      status: response.status
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}