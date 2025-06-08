import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { instagramApiService } from '@/services/instagramApiService';

// Server-side Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  console.log('🔍 Analyze API route called');
  
  try {
    const { requestId } = await request.json();
    console.log('📋 Processing request ID:', requestId);

    // 1. Find the analysis request (bypassing RLS with service role)
    console.log('🔍 Searching for request in database...');
    
    const { data: analysisRequest, error: requestError } = await supabase
      .from('analysis_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    console.log('📊 Database query result:', {
      found: analysisRequest ? 1 : 0,
      error: requestError,
      requestId,
      data: analysisRequest ? 'Found' : 'Not found'
    });

    if (requestError || !analysisRequest) {
      console.error('❌ Request not found:', requestError);
      return NextResponse.json(
        { error: 'Request not found in database', details: requestError },
        { status: 404 }
      );
    }

    console.log('✅ Found analysis request:', {
      id: analysisRequest.id,
      user_id: analysisRequest.user_id,
      platform: analysisRequest.platform,
      status: analysisRequest.status
    });

    // 2. Get the Instagram account using the correct user_id (UUID)
    const { data: instagramAccount, error: accountError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', analysisRequest.user_id)
      .eq('is_active', true)
      .single();

    if (accountError || !instagramAccount) {
      console.error('❌ Instagram account not found:', accountError);
      return NextResponse.json(
        { error: 'Instagram account not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found Instagram account:', {
      id: instagramAccount.id,
      handle: instagramAccount.instagram_handle,
      hasToken: !!instagramAccount.access_token
    });

    // 3. Update request status to processing
    await supabase
      .from('analysis_requests')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // 4. Fetch Instagram data using real API
    console.log('📱 Fetching Instagram data via API...');
    
    const instagramData = await instagramApiService.getInstagramDataPackage(
      instagramAccount.access_token,
      instagramAccount.instagram_id
    );

    console.log('✅ Instagram data fetched:', {
      profile: !!instagramData.profile,
      mediaCount: instagramData.media?.length || 0,
      hasMetrics: !!instagramData.metrics
    });

    // 5. Create simplified report data structure
    const reportData = {
      profile: {
        username: instagramData.profile?.username || instagramAccount.instagram_handle,
        name: instagramData.profile?.name || '',
        followers_count: instagramData.profile?.followers_count || 0,
        follows_count: instagramData.profile?.follows_count || 0,
        media_count: instagramData.profile?.media_count || 0,
        biography: instagramData.profile?.biography || '',
        engagement_rate: instagramData.metrics?.overall_engagement_rate || 0
      },
      summary: {
        overallScore: Math.min(100, Math.round((instagramData.metrics?.overall_engagement_rate || 0) * 10)),
        totalPosts: instagramData.media?.length || 0,
        avgLikes: Math.round(instagramData.metrics?.avg_likes_per_post || 0),
        avgComments: Math.round(instagramData.metrics?.avg_comments_per_post || 0),
        topPerformingPost: instagramData.media?.sort((a, b) => 
          ((b.like_count || 0) + (b.comments_count || 0)) - 
          ((a.like_count || 0) + (a.comments_count || 0))
        )[0] || null
      },
      // Store the full Instagram data for detailed views
      raw_instagram_data: instagramData,
      analysis_date: new Date().toISOString()
    };

    // 6. Create report record - let's try this step by step with better error handling
    console.log('📋 Creating report record...');
    console.log('📋 Report data structure:', {
      user_id: analysisRequest.user_id,
      hasReportData: !!reportData,
      profileUsername: reportData.profile.username
    });

    try {
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: analysisRequest.user_id,
          report_data: reportData,
          status: 'completed'
          // Note: removed request_id field since it might not be required
        })
        .select()
        .single();

      if (reportError) {
        console.error('❌ Report creation error details:', {
          error: reportError,
          message: reportError.message,
          code: reportError.code,
          details: reportError.details
        });
        throw new Error(`Report creation failed: ${reportError.message}`);
      }

      console.log('✅ Report record created successfully:', {
        reportId: reportRecord.id,
        userId: reportRecord.user_id,
        status: reportRecord.status
      });

      // 7. Update analysis request status to completed
      await supabase
        .from('analysis_requests')
        .update({ 
          status: 'completed',
          results: reportData,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      console.log('🎉 Analysis completed successfully!');

      return NextResponse.json({
        success: true,
        message: 'Analysis completed successfully',
        report_id: reportRecord.id,
        results: reportData
      });

    } catch (reportCreationError) {
      console.error('💥 Report creation failed:', reportCreationError);
      
      // Still update the analysis request with results even if report creation failed
      await supabase
        .from('analysis_requests')
        .update({ 
          status: 'completed',
          results: reportData,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      return NextResponse.json({
        success: true,
        message: 'Analysis completed but report creation failed',
        error: 'Report creation failed',
        results: reportData
      });
    }

  } catch (error) {
    console.error('💥 Analysis API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}