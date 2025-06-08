// File: src/app/api/sync/daily/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { DataScheduler } from '../../../../services/dataScheduler';
import { headers } from 'next/headers';

const scheduler = new DataScheduler();

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (you might want to add API key auth)
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    // Add your own secret key for cron job authentication
    const expectedToken = process.env.CRON_SECRET_KEY;
    if (expectedToken && authorization !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Daily sync triggered via API');
    
    // Run the daily collection
    const results = await scheduler.runDailyCollection();
    
    // Also check and refresh tokens
    await scheduler.checkAndRefreshTokens();
    
    return NextResponse.json({
      success: true,
      message: 'Daily sync completed',
      results
    });
    
  } catch (error) {
    console.error('❌ Error in daily sync API:', error);
    
    return NextResponse.json(
      { 
        error: 'Daily sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get sync status for monitoring
    const status = await scheduler.getSyncStatus();
    
    return NextResponse.json({
      success: true,
      accounts: status.length,
      lastSync: status[0]?.last_sync_at || null,
      status
    });
    
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}