// app/api/analytics/route.ts - EXACTLY MATCHED to your Supabase schema
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key (secure!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`📊 Analytics API: Processing ${type} event`)

    // Get user IP and other server-side data
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')
    
    // Try multiple ways to get the client IP
    const ip = forwardedFor 
      ? forwardedFor.split(',')[0].trim()
      : realIp 
      ? realIp.trim()
      : request.headers.get('cf-connecting-ip') // Cloudflare
      || request.headers.get('x-client-ip')
      || 'unknown'

    let result;

    switch (type) {
      case 'signup':
        console.log('📝 Tracking user signup...')
        
        // user_analytics table columns (from your schema):
        const signupData = {
          user_id: data.user_id,
          signup_timestamp: data.signup_timestamp,
          signup_source: data.signup_source,
          referral_url: data.referral_url,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign,
          utm_content: data.utm_content,
          utm_term: data.utm_term,
          country: data.country,
          state: data.state,
          city: data.city,
          ip_address: ip, // inet type
          user_agent: userAgent,
          device_type: data.device_type,
          browser: data.browser,
          os: data.os
          // created_at, updated_at are auto-populated
        }
        
        result = await supabaseAdmin.from('user_analytics').insert(signupData)
        
        // Also initialize retention tracking
        if (!result.error) {
          await supabaseAdmin.from('user_retention_snapshots').insert({
            user_id: data.user_id,
            signup_date: new Date().toISOString().split('T')[0] // date type
          })
          console.log('✅ Signup and retention tracking successful')
        }
        break

      case 'session_start':
        console.log('🚀 Tracking session start...')
        
        // user_sessions table columns (from your schema):
        const sessionStartData = {
          user_id: data.user_id,
          session_id: data.session_id, // text, required
          session_start: data.session_start, // timestamp with time zone
          country: data.country, // text, nullable
          city: data.city, // text, nullable
          device_type: data.device_type // text, nullable
          // pages_visited, actions_taken have defaults of 0
          // created_at is auto-populated
        }
        
        result = await supabaseAdmin.from('user_sessions').insert(sessionStartData)
        break

      case 'session_end':
        console.log('🛑 Tracking session end...')
        
        // Update user_sessions table columns (from your schema):
        const sessionEndData = {
          session_end: data.session_end, // timestamp with time zone
          duration_seconds: data.duration_seconds, // integer
          pages_visited: data.pages_visited, // integer
          actions_taken: data.actions_taken // integer
        }
        
        result = await supabaseAdmin
          .from('user_sessions')
          .update(sessionEndData)
          .eq('session_id', data.session_id)
        break

      case 'feature_usage':
        console.log('🎯 Tracking feature usage...')
        
        // feature_usage table columns (from your EXACT schema):
        const featureData = {
          user_id: data.user_id, // uuid, required
          session_id: data.session_id, // text, nullable ✅ This exists!
          feature_name: data.feature_name, // text, required
          action_type: data.action_type, // text, required
          page_path: data.page_path, // text, nullable ✅ This exists!
          metadata: data.metadata || {}, // jsonb, nullable
          timestamp: data.timestamp // timestamp with time zone
          // created_at is auto-populated
        }
        
        result = await supabaseAdmin.from('feature_usage').insert(featureData)
        break

      case 'engagement':
        console.log('❤️ Tracking engagement event...')
        
        // engagement_events table columns (from your schema):
        const engagementData = {
          user_id: data.user_id, // uuid, required
          event_type: data.event_type, // text, required
          event_properties: data.event_properties || {}, // jsonb, nullable
          timestamp: data.timestamp // timestamp with time zone
          // created_at is auto-populated
        }
        
        result = await supabaseAdmin.from('engagement_events').insert(engagementData)
        break

      case 'feedback':
        console.log('💬 Tracking user feedback...')
        
        // user_feedback table columns (from your schema):
        const feedbackData = {
          user_id: data.user_id, // uuid, required
          feedback_type: data.feedback_type, // text, required
          score: data.score, // integer, nullable
          feedback_text: data.feedback_text, // text, nullable
          feature_context: data.feature_context, // text, nullable
          metadata: data.metadata || {} // jsonb, nullable
          // created_at is auto-populated
        }
        
        result = await supabaseAdmin.from('user_feedback').insert(feedbackData)
        break

      case 'funnel':
        console.log('🔄 Tracking funnel step...')
        
        // conversion_funnels table columns (from your schema):
        const funnelData = {
          user_id: data.user_id, // uuid, required
          funnel_name: data.funnel_name, // text, required
          step_name: data.step_name, // text, required
          step_order: data.step_order, // integer, required
          completed_at: data.completed_at, // timestamp with time zone, nullable
          dropped_off_at: data.dropped_off_at, // timestamp with time zone, nullable
          metadata: data.metadata || {} // jsonb, nullable
          // created_at is auto-populated
        }
        
        result = await supabaseAdmin.from('conversion_funnels').insert(funnelData)
        break

      case 'user_identify':
        console.log('👤 Updating user analytics...')
        
        // user_analytics table upsert (from your schema):
        const identifyData = {
          user_id: data.user_id,
          country: data.country,
          state: data.state,
          city: data.city,
          ip_address: ip,
          user_agent: userAgent,
          device_type: data.device_type,
          browser: data.browser,
          os: data.os,
          // Add any other properties from data that match schema
          ...(data.email && { email: data.email }),
          ...(data.plan && { plan: data.plan }),
          ...(data.instagramConnected !== undefined && { instagram_connected: data.instagramConnected })
        }
        
        result = await supabaseAdmin.from('user_analytics').upsert(identifyData)
        break

      case 'retention_update':
        console.log('📈 Updating retention data...')
        
        const today = data.last_active_date
        
        // Get user's signup date first
        const { data: userAnalytics } = await supabaseAdmin
          .from('user_analytics')
          .select('signup_timestamp')
          .eq('user_id', data.user_id)
          .single()

        if (userAnalytics) {
          const signupDate = new Date(userAnalytics.signup_timestamp)
          const daysSinceSignup = Math.floor((new Date().getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

          // user_retention_snapshots table columns (from your schema):
          const updateData: any = {
            last_active_date: today // date type
          }

          if (daysSinceSignup === 1) updateData.day_1_active = true
          if (daysSinceSignup === 7) updateData.day_7_active = true
          if (daysSinceSignup === 30) updateData.day_30_active = true

          result = await supabaseAdmin
            .from('user_retention_snapshots')
            .update(updateData)
            .eq('user_id', data.user_id)
        }
        break

      default:
        console.error('❌ Invalid analytics type:', type)
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

    if (result?.error) {
      console.error(`❌ Supabase error for ${type}:`, result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    console.log(`✅ Successfully tracked ${type}`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}