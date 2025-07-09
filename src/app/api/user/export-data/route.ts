// app/api/user/export-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Data export API called')
    
    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No need to set cookies in API routes
          },
          remove(name: string, options: CookieOptions) {
            // No need to remove cookies in API routes
          },
        },
      }
    )
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No authenticated user:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 })
    }

    console.log('✅ Authenticated user:', user.id)

    // Gather all user data
    const userData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        exportFormat: 'JSON',
        dataTypes: ['profile', 'instagram_accounts', 'daily_snapshots', 'sync_logs']
      },
      
      // User profile data
      userProfile: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at
      },

      // These will be filled in later
      instagramAccounts: undefined as
        | { error: string; data: any[] }
        | { count: number; data: any[] }
        | undefined,
      dailySnapshots: undefined as
        | { error: string; data: any[] }
        | { count: number; data: any[]; dateRange: { earliest: string; latest: string } | null }
        | undefined,
      syncLogs: undefined as
        | { error: string; data: any[] }
        | { count: number; data: any[] }
        | undefined,
      dataGatheringError: undefined as
        | { message: string; timestamp: string }
        | undefined,
      summary: undefined as
        | {
            totalInstagramAccounts: number
            totalDailySnapshots: number
            totalSyncLogs: number
            dataTimespan: string
            exportSize: number
            exportedAt: string
          }
        | undefined,
    }

    try {
      // Get Instagram accounts
      console.log('📸 Fetching Instagram accounts...')
      const { data: instagramAccounts, error: igError } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', user.id)

      if (igError) {
        console.error('❌ Error fetching Instagram accounts:', igError)
        userData.instagramAccounts = { error: igError.message, data: [] }
      } else {
        // Remove sensitive data before export
        const cleanedAccounts = instagramAccounts?.map(account => ({
          id: account.id,
          username: account.username,
          instagram_id: account.instagram_id,
          is_active: account.is_active,
          created_at: account.created_at,
          updated_at: account.updated_at,
          // Note: access_token is NOT included for security
        })) || []
        
        userData.instagramAccounts = {
          count: cleanedAccounts.length,
          data: cleanedAccounts
        }
        console.log(`✅ Found ${cleanedAccounts.length} Instagram accounts`)
      }

      // Get daily snapshots (analytics data)
      console.log('📊 Fetching daily snapshots...')
      const { data: snapshots, error: snapshotsError } = await supabase
        .from('daily_snapshots')
        .select('*')
        .in('instagram_account_id', instagramAccounts?.map(acc => acc.id) || [])
        .order('snapshot_date', { ascending: false })

      if (snapshotsError) {
        console.error('❌ Error fetching snapshots:', snapshotsError)
        userData.dailySnapshots = { error: snapshotsError.message, data: [] }
      } else {
        userData.dailySnapshots = {
          count: snapshots?.length || 0,
          data: snapshots || [],
          dateRange: snapshots && snapshots.length > 0 ? {
            earliest: snapshots[snapshots.length - 1]?.snapshot_date,
            latest: snapshots[0]?.snapshot_date
          } : null
        }
        console.log(`✅ Found ${snapshots?.length || 0} daily snapshots`)
      }

      // Get sync logs
      console.log('🔄 Fetching sync logs...')
      const { data: syncLogs, error: syncError } = await supabase
        .from('sync_logs')
        .select('*')
        .in('instagram_account_id', instagramAccounts?.map(acc => acc.id) || [])
        .order('started_at', { ascending: false })
        .limit(100) // Limit to last 100 sync logs

      if (syncError) {
        console.error('❌ Error fetching sync logs:', syncError)
        userData.syncLogs = { error: syncError.message, data: [] }
      } else {
        // Clean sync logs by removing sensitive API response data
        const cleanedLogs = syncLogs?.map(log => ({
          id: log.id,
          sync_type: log.sync_type,
          status: log.status,
          started_at: log.started_at,
          completed_at: log.completed_at,
          records_processed: log.records_processed,
          error_message: log.error_message,
          // Note: api_response is excluded as it may contain sensitive data
        })) || []

        userData.syncLogs = {
          count: cleanedLogs.length,
          data: cleanedLogs
        }
        console.log(`✅ Found ${cleanedLogs.length} sync logs`)
      }

    } catch (dataError) {
      console.error('❌ Error gathering user data:', dataError)
      userData.dataGatheringError = {
        message: dataError instanceof Error ? dataError.message : String(dataError),
        timestamp: new Date().toISOString()
      }
    }

    // Add summary statistics
    userData.summary = {
      totalInstagramAccounts:
        userData.instagramAccounts && 'count' in userData.instagramAccounts
          ? userData.instagramAccounts.count
          : 0,
      totalDailySnapshots:
        userData.dailySnapshots && 'count' in userData.dailySnapshots
          ? userData.dailySnapshots.count
          : 0,
      totalSyncLogs:
        userData.syncLogs && 'count' in userData.syncLogs
          ? userData.syncLogs.count
          : 0,
      dataTimespan: userData.dailySnapshots && 'dateRange' in userData.dailySnapshots && userData.dailySnapshots.dateRange
        ? `${userData.dailySnapshots.dateRange.earliest} to ${userData.dailySnapshots.dateRange.latest}`
        : 'No data available',
      exportSize: JSON.stringify(userData).length,
      exportedAt: new Date().toISOString()
    }

    console.log('📦 Export summary:', userData.summary)

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `socialsage-data-export-${timestamp}.json`

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    })

  } catch (error) {
    console.error('❌ Data export error:', error)
    return NextResponse.json({ 
      error: 'Failed to export data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'