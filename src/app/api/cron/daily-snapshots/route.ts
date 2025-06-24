// app/api/cron/daily-snapshots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Interfaces from your existing code
interface MediaInsights {
  reach: number;
  views: number;
  engagement: number;
  profile_visits: number;
  profile_activity: number;
  saved: number;
  shares: number;
  total_interactions: number;
}

interface PostWithInsights {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count: number;
  comments_count: number;
  insights: MediaInsights;
}

export async function GET(request: NextRequest) {
  console.log('🔄 Starting daily Instagram data collection cron job...')
  
  // Verify this is called by your cron service (Vercel Cron, GitHub Actions, etc.)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    console.log('❌ Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin access
  )
  
  try {
    // Get all active Instagram accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('instagram_accounts')
      .select('id, user_id, access_token, instagram_id, username')
      .eq('is_active', true)
    
    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      console.log('ℹ️ No active Instagram accounts found')
      return NextResponse.json({ success: true, processed: 0, message: 'No accounts to process' })
    }

    console.log(`📊 Processing ${accounts.length} Instagram accounts...`)
    
    const results = []
    
    // Process each account
    for (const account of accounts) {
      console.log(`\n📱 Processing account: ${account.username} (${account.id})`)
      
      try {
        // Log sync start
        const { data: syncLog } = await supabase
          .from('sync_logs')
          .insert({
            instagram_account_id: account.id,
            sync_type: 'daily_snapshot',
            status: 'started',
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        // Fetch Instagram data for this account
        const instagramData = await fetchInstagramDataForAccount(account)
        
        if (!instagramData) {
          throw new Error('Failed to fetch Instagram data')
        }

        // Capture daily snapshot
        const snapshotResult = await captureDailySnapshotForCron(
          supabase, 
          account.id, 
          instagramData.profile,
          instagramData.posts
        )

        if (snapshotResult.success) {
          console.log(`✅ Successfully captured snapshot for ${account.username}`)
          
          // Update sync log success
          if (syncLog) {
            await supabase
              .from('sync_logs')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                records_processed: 1,
                api_response: { snapshot: snapshotResult.data }
              })
              .eq('id', syncLog.id)
          }
          
          results.push({
            account_id: account.id,
            username: account.username,
            status: 'success',
            followers: instagramData.profile.followers_count
          })
        } else {
          throw new Error(`Snapshot capture failed: ${snapshotResult.error}`)
        }

      } catch (error) {
        console.error(`❌ Error processing account ${account.username}:`, error)
        
        // Log error to sync_logs
        await supabase
          .from('sync_logs')
          .insert({
            instagram_account_id: account.id,
            sync_type: 'daily_snapshot',
            status: 'error',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : String(error),
            records_processed: 0
          })
        
        results.push({
          account_id: account.id,
          username: account.username,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`\n📊 Cron job completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      processed: accounts.length,
      successful: successCount,
      errors: errorCount,
      results
    })

  } catch (error) {
    console.error('❌ Fatal error in cron job:', error)
    return NextResponse.json({ 
      error: 'Cron job failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}

// Fetch Instagram data for a specific account (without user session)
async function fetchInstagramDataForAccount(account: any) {
  console.log(`🔍 Fetching Instagram data for ${account.username}...`)
  
  try {
    // Test API access
    const testResponse = await fetch(
      `https://graph.instagram.com/me?access_token=${account.access_token}`
    )
    
    if (!testResponse.ok) {
      console.log('❌ Instagram API access test failed:', testResponse.status)
      return null
    }

    // Fetch profile data
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=followers_count,media_count,username&access_token=${account.access_token}`
    )

    if (!profileResponse.ok) {
      console.log('❌ Profile fetch failed:', profileResponse.status)
      return null
    }

    const profileData = await profileResponse.json()
    console.log(`✅ Profile data fetched for ${profileData.username}:`, {
      followers: profileData.followers_count,
      media_count: profileData.media_count
    })

    // Fetch recent media (last 50 posts)
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,thumbnail_url,timestamp,caption,like_count,comments_count&limit=50&access_token=${account.access_token}`
    )

    let postsWithInsights: PostWithInsights[] = []

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      console.log(`📱 Fetched ${mediaData.data.length} posts`)
      
      // Process posts in batches to avoid rate limits
      const batchSize = 5
      for (let i = 0; i < mediaData.data.length; i += batchSize) {
        const batch = mediaData.data.slice(i, i + batchSize)
        
        const batchResults = await Promise.all(
          batch.map(async (post: any): Promise<PostWithInsights> => {
            const insights = await fetchPostInsightsForCron(post.id, account.access_token)
            
            return {
              id: post.id,
              media_type: post.media_type,
              media_url: post.media_url,
              thumbnail_url: post.thumbnail_url,
              permalink: post.permalink,
              timestamp: post.timestamp,
              caption: post.caption,
              like_count: post.like_count || 0,
              comments_count: post.comments_count || 0,
              insights
            }
          })
        )
        
        postsWithInsights.push(...batchResults)
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return {
      profile: profileData,
      posts: postsWithInsights
    }

  } catch (error) {
    console.error(`❌ Error fetching Instagram data for ${account.username}:`, error)
    return null
  }
}

// Simplified insights fetching for cron (with fallbacks)
async function fetchPostInsightsForCron(postId: string, accessToken: string): Promise<MediaInsights> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/${postId}/insights?metric=reach&access_token=${accessToken}`
    )
    
    if (response.ok) {
      const data = await response.json()
      const reach = data.data?.[0]?.values?.[0]?.value || 0
      
      return {
        reach,
        views: 0,
        engagement: 0,
        profile_visits: 0,
        profile_activity: 0,
        saved: 0,
        shares: 0,
        total_interactions: 0
      }
    }
  } catch (error) {
    // Silently handle insights errors - not all posts have insights
  }
  
  return {
    reach: 0,
    views: 0,
    engagement: 0,
    profile_visits: 0,
    profile_activity: 0,
    saved: 0,
    shares: 0,
    total_interactions: 0
  }
}

// Modified version of your existing captureDailySnapshot function for cron use
async function captureDailySnapshotForCron(
  supabase: any,
  instagramAccountId: string,
  profileData: any,
  postsWithInsights: PostWithInsights[]
) {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Calculate metrics
    const totalLikes = postsWithInsights.reduce((sum, post) => sum + post.like_count, 0)
    const totalComments = postsWithInsights.reduce((sum, post) => sum + post.comments_count, 0)
    const totalReach = postsWithInsights.reduce((sum, post) => sum + post.insights.reach, 0)
    const totalSaves = postsWithInsights.reduce((sum, post) => sum + post.insights.saved, 0)
    const totalShares = postsWithInsights.reduce((sum, post) => sum + post.insights.shares, 0)
    
    const avgLikes = postsWithInsights.length > 0 ? Math.round(totalLikes / postsWithInsights.length) : 0
    const avgComments = postsWithInsights.length > 0 ? Math.round(totalComments / postsWithInsights.length) : 0
    const totalEngagement = totalLikes + totalComments + totalSaves + totalShares
    
    // Calculate engagement rate
    let engagementRate = 0
    if (totalReach > 0) {
      engagementRate = (totalEngagement / totalReach) * 100
    } else if (profileData.followers_count > 0 && postsWithInsights.length > 0) {
      engagementRate = (totalEngagement / (profileData.followers_count * postsWithInsights.length)) * 100
    }
    
    const snapshotData = {
      instagram_account_id: instagramAccountId,
      snapshot_date: today,
      followers_count: profileData.followers_count || 0,
      following_count: 0,
      media_count: profileData.media_count || 0,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_shares: totalShares,
      total_saves: totalSaves,
      engagement_rate: engagementRate,
      avg_likes_per_post: avgLikes,
      avg_comments_per_post: avgComments,
      total_reach: totalReach,
      total_impressions: postsWithInsights.reduce((sum, post) => sum + post.insights.views, 0),
      posts_published_count: postsWithInsights.length,
      raw_profile_data: {
        username: profileData.username,
        followers: profileData.followers_count,
        mediaCount: profileData.media_count
      },
      raw_insights_data: {
        postsAnalyzed: postsWithInsights.length,
        totalReach,
        totalEngagement,
        avgEngagementRate: engagementRate
      }
    }
    
    // Upsert daily snapshot
    const { data, error } = await supabase
      .from('daily_snapshots')
      .upsert(snapshotData, {
        onConflict: 'instagram_account_id,snapshot_date'
      })
      .select()
    
    if (error) {
      console.error('❌ Failed to capture daily snapshot:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Daily snapshot captured successfully')
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Error in captureDailySnapshotForCron:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export const dynamic = 'force-dynamic'