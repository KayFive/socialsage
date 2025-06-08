// File: src/app/api/sync/user/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { DataScheduler } from '../../../../services/dataScheduler';
import { createClient } from '../../../../lib/supabaseServer';

const scheduler = new DataScheduler();

export async function POST(request: NextRequest) {
  try {
    // Use server client, not browser client
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`🔄 Manual sync triggered for user: ${user.id}`);
    
    // Run data collection for this specific user
    const results = await scheduler.runUserDataCollection(user.id);
    
    return NextResponse.json({
      success: true,
      message: 'User sync completed',
      results
    });
    
  } catch (error) {
    console.error('❌ Error in user sync API:', error);
    
    return NextResponse.json(
      { 
        error: 'User sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}