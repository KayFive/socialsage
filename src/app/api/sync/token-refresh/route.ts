// File: src/app/api/sync/token-refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { DataScheduler } from '../../../../services/dataScheduler';
import { headers } from 'next/headers';

const scheduler = new DataScheduler();

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    const expectedToken = process.env.CRON_SECRET_KEY;
    if (expectedToken && authorization !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔑 Token refresh check triggered via API');
    
    // Check and refresh tokens
    await scheduler.checkAndRefreshTokens();
    
    return NextResponse.json({
      success: true,
      message: 'Token refresh check completed'
    });
    
  } catch (error) {
    console.error('❌ Error in token refresh API:', error);
    
    return NextResponse.json(
      { 
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}