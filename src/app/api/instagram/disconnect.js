// /api/instagram/disconnect.js
import { createServerClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete Instagram connection from database
    const { error: deleteError } = await supabase
      .from('instagram_connections')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting Instagram connection:', deleteError);
      return NextResponse.json(
        { error: 'Failed to disconnect Instagram account' },
        { status: 500 }
      );
    }

    // Optionally, you might also want to:
    // 1. Revoke the access token with Instagram/Meta
    // 2. Clear any cached data related to this connection
    // 3. Log this action for audit purposes

    return NextResponse.json(
      { message: 'Instagram account disconnected successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in disconnect API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}