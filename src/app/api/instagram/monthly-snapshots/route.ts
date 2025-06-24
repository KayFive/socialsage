// app/api/instagram/monthly-snapshots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Snapshot {
  date: string;
  followers: number;
  isComplete: boolean;
  reach?: number;
  impressions?: number;
  engagement_rate?: number;
}

interface HistoricalData {
  weekly: Snapshot[];
  monthly: Snapshot[];
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Instagram account info including connection date
    const { data: instagramAccount, error: igError } = await supabase
      .from('instagram_accounts')
      .select('id, created_at, username, followers_count')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (igError || !instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })
    }

    // Get ALL daily snapshots for both weekly and monthly aggregation
    const { data: dailySnapshots, error: snapshotsError } = await supabase
      .from('daily_snapshots')
      .select(`
        snapshot_date,
        followers_count,
        total_reach,
        total_impressions,
        engagement_rate,
        created_at
      `)
      .eq('instagram_account_id', instagramAccount.id)
      .order('snapshot_date', { ascending: true })

    if (snapshotsError) {
      console.error('Error fetching daily snapshots:', snapshotsError)
      return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
    }

    // Generate both weekly and monthly snapshots
    const historicalData: HistoricalData = {
      weekly: generateWeeklySnapshots(dailySnapshots || [], instagramAccount.followers_count),
      monthly: generateMonthlySnapshots(dailySnapshots || [], instagramAccount.followers_count)
    }
    
    const connectionDate = instagramAccount.created_at ? 
      new Date(instagramAccount.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }) : null

    // Calculate days of data collection
    const oldestSnapshot = dailySnapshots && dailySnapshots.length > 0 ? dailySnapshots[0] : null
    const daysOfData = oldestSnapshot ? 
      Math.floor((new Date().getTime() - new Date(oldestSnapshot.snapshot_date).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 
      0

    return NextResponse.json({
      historicalData,
      connectionDate,
      username: instagramAccount.username,
      hasData: (dailySnapshots || []).length > 0,
      daysOfData,
      dataAvailableSince: oldestSnapshot ? 
        new Date(oldestSnapshot.snapshot_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }) : null
    })

  } catch (error) {
    console.error('Monthly snapshots API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

function generateWeeklySnapshots(dailySnapshots: any[], currentFollowers: number): Snapshot[] {
  const now = new Date()
  const weeklyData = new Map<string, Snapshot>()
  
  // Generate last 4 weeks
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - (i * 7))
    
    // Normalize to end of week (Saturday)
    const dayOfWeek = weekEnd.getDay()
    const daysToSaturday = (6 - dayOfWeek + 7) % 7
    weekEnd.setDate(weekEnd.getDate() + daysToSaturday)
    
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6) // Go back to Sunday
    
    const weekKey = weekEnd.toISOString().slice(0, 10)
    
    weeklyData.set(weekKey, {
      date: weekKey,
      followers: 0,
      isComplete: weekEnd < now,
      reach: 0,
      impressions: 0,
      engagement_rate: 0
    })
  }
  
  // Fill with actual data
  dailySnapshots.forEach(snapshot => {
    const snapshotDate = new Date(snapshot.snapshot_date)
    
    // Find which week this snapshot belongs to
    weeklyData.forEach((weekData, weekKey) => {
      const weekEndDate = new Date(weekKey)
      const weekStartDate = new Date(weekEndDate)
      weekStartDate.setDate(weekStartDate.getDate() - 6)
      
      // If snapshot is within this week and is the latest for the week
      if (snapshotDate >= weekStartDate && snapshotDate <= weekEndDate) {
        const existingDate = weekData.date ? new Date(weekData.date) : new Date(0)
        
        if (!weekData.followers || snapshotDate > existingDate) {
          weeklyData.set(weekKey, {
            date: weekKey,
            followers: snapshot.followers_count || 0,
            isComplete: weekEndDate < now,
            reach: snapshot.total_reach || 0,
            impressions: snapshot.total_impressions || 0,
            engagement_rate: snapshot.engagement_rate || 0
          })
        }
      }
    })
  })
  
  // Handle current week with live data
  const currentWeekKey = Array.from(weeklyData.keys())[weeklyData.size - 1]
  const currentWeekData = weeklyData.get(currentWeekKey)
  
  if (currentWeekData && (!currentWeekData.followers || !currentWeekData.isComplete)) {
    weeklyData.set(currentWeekKey, {
      ...currentWeekData,
      followers: currentFollowers,
      isComplete: false
    })
  }
  
  return Array.from(weeklyData.values())
    .filter(snapshot => snapshot.followers > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function generateMonthlySnapshots(dailySnapshots: any[], currentFollowers: number): Snapshot[] {
  const now = new Date()
  const monthlyData = new Map<string, Snapshot>()
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const lastDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const monthKey = lastDayOfMonth.toISOString().slice(0, 10)
    
    monthlyData.set(monthKey, {
      date: monthKey,
      followers: 0,
      isComplete: lastDayOfMonth < now,
      reach: 0,
      impressions: 0,
      engagement_rate: 0
    })
  }
  
  // Process daily snapshots to find month-end values
  dailySnapshots.forEach(snapshot => {
    const snapshotDate = new Date(snapshot.snapshot_date)
    const lastDayOfSnapshotMonth = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth() + 1, 0)
    const monthKey = lastDayOfSnapshotMonth.toISOString().slice(0, 10)
    
    if (monthlyData.has(monthKey)) {
      const existing = monthlyData.get(monthKey)!
      const existingDate = existing.date ? new Date(existing.date.slice(0, 10)) : new Date(0)
      
      // Keep the latest snapshot for each month (closest to month-end)
      if (!existing.followers || snapshotDate > existingDate) {
        monthlyData.set(monthKey, {
          date: monthKey,
          followers: snapshot.followers_count || 0,
          isComplete: isMonthComplete(monthKey),
          reach: snapshot.total_reach || 0,
          impressions: snapshot.total_impressions || 0,
          engagement_rate: snapshot.engagement_rate || 0
        })
      }
    }
  })
  
  // Handle current month with live data
  const currentMonthKey = Array.from(monthlyData.keys())[monthlyData.size - 1]
  const currentMonthData = monthlyData.get(currentMonthKey)
  
  if (currentMonthData && (!currentMonthData.followers || !currentMonthData.isComplete)) {
    monthlyData.set(currentMonthKey, {
      ...currentMonthData,
      followers: currentFollowers,
      isComplete: false
    })
  }
  
  return Array.from(monthlyData.values())
    .filter(snapshot => snapshot.followers > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function isMonthComplete(monthKey: string): boolean {
  const now = new Date()
  const [year, month, day] = monthKey.split('-').map(Number)
  const monthEndDate = new Date(year, month - 1, day)
  return monthEndDate < now
}

// POST endpoint to manually trigger daily snapshot capture
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      followersCount, 
      totalReach, 
      totalImpressions, 
      engagementRate,
      avgLikes,
      avgComments,
      totalSaves,
      totalShares,
      mediaCount
    } = await request.json()
    
    if (!followersCount || typeof followersCount !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Get Instagram account
    const { data: instagramAccount, error: igError } = await supabase
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (igError || !instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Upsert daily snapshot with all available metrics
    const { data, error } = await supabase
      .from('daily_snapshots')
      .upsert({
        instagram_account_id: instagramAccount.id,
        snapshot_date: today,
        followers_count: followersCount,
        total_reach: totalReach || 0,
        total_impressions: totalImpressions || 0,
        engagement_rate: engagementRate || 0,
        avg_likes_per_post: avgLikes || 0,
        avg_comments_per_post: avgComments || 0,
        total_saves: totalSaves || 0,
        total_shares: totalShares || 0,
        media_count: mediaCount || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'instagram_account_id,snapshot_date'
      })
      .select()

    if (error) {
      console.error('Error updating daily snapshot:', error)
      return NextResponse.json({ error: 'Failed to update snapshot' }, { status: 500 })
    }

    // Also update the instagram_accounts table with current follower count
    await supabase
      .from('instagram_accounts')
      .update({
        followers_count: followersCount,
        media_count: mediaCount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', instagramAccount.id)

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Daily snapshot POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'