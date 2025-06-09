// File: src/app/api/test-sync/route.ts
// Temporary test endpoint to trigger sync

import { NextRequest, NextResponse } from 'next/server';
import { DataScheduler } from '../../../services/dataScheduler';

const scheduler = new DataScheduler();

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Test sync triggered');
    
    // Run the daily collection for all active accounts
    const results = await scheduler.runDailyCollection();
    
    return NextResponse.json({
      success: true,
      message: 'Test sync completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in test sync:', error);
    
    return NextResponse.json(
      { 
        error: 'Test sync failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}