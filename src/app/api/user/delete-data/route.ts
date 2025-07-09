// app/api/user/delete-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ Data deletion API called')
    
    // Create Supabase client with service role for comprehensive deletion
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

    // Create service role client for admin operations
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin access
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No authenticated user:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 })
    }

    console.log('✅ Authenticated user for deletion:', user.id)

    // Parse request body for deletion type
    const body = await request.json().catch(() => ({}))
    const { deletionType = 'complete', confirmationText = '' } = body

    // Require confirmation for complete account deletion
    if (deletionType === 'complete' && confirmationText !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ 
        error: 'Confirmation required',
        message: 'Please type "DELETE MY ACCOUNT" to confirm complete account deletion'
      }, { status: 400 })
    }

    const deletionResults: {
      userId: string,
      userEmail: string | undefined,
      deletionType: any,
      deletionStarted: string,
      steps: Array<{step: string, status: 'success' | 'error' | 'skipped', details?: string, count?: number}>,
      deletionCompleted?: string
    } = {
      userId: user.id,
      userEmail: user.email,
      deletionType,
      deletionStarted: new Date().toISOString(),
      steps: []
    }

    try {
      // Step 1: Get all Instagram accounts for this user
      console.log('📸 Finding Instagram accounts to delete...')
      const { data: instagramAccounts, error: igError } = await supabase
        .from('instagram_accounts')
        .select('id, username')
        .eq('user_id', user.id)

      if (igError) {
        deletionResults.steps.push({
          step: 'fetch_instagram_accounts',
          status: 'error',
          details: igError.message
        })
      } else {
        const accountCount = instagramAccounts?.length || 0
        console.log(`📊 Found ${accountCount} Instagram accounts`)
        deletionResults.steps.push({
          step: 'fetch_instagram_accounts',
          status: 'success',
          count: accountCount,
          details: instagramAccounts?.map(acc => acc.username).join(', ') || 'none'
        })

        if (accountCount > 0) {
          const accountIds = instagramAccounts.map(acc => acc.id)

          // Step 2: Delete daily snapshots
          console.log('📊 Deleting daily snapshots...')
          const { count: snapshotsDeleted, error: snapshotsError } = await adminSupabase
            .from('daily_snapshots')
            .delete()
            .in('instagram_account_id', accountIds)

          if (snapshotsError) {
            deletionResults.steps.push({
              step: 'delete_daily_snapshots',
              status: 'error',
              details: snapshotsError.message
            })
          } else {
            console.log(`✅ Deleted ${snapshotsDeleted || 0} daily snapshots`)
            deletionResults.steps.push({
              step: 'delete_daily_snapshots',
              status: 'success',
              count: snapshotsDeleted || 0
            })
          }

          // Step 3: Delete sync logs
          console.log('🔄 Deleting sync logs...')
          const { count: logsDeleted, error: logsError } = await adminSupabase
            .from('sync_logs')
            .delete()
            .in('instagram_account_id', accountIds)

          if (logsError) {
            deletionResults.steps.push({
              step: 'delete_sync_logs',
              status: 'error',
              details: logsError.message
            })
          } else {
            console.log(`✅ Deleted ${logsDeleted || 0} sync logs`)
            deletionResults.steps.push({
              step: 'delete_sync_logs',
              status: 'success',
              count: logsDeleted || 0
            })
          }

          // Step 4: Delete Instagram accounts
          console.log('📸 Deleting Instagram accounts...')
          const { count: accountsDeleted, error: accountsError } = await adminSupabase
            .from('instagram_accounts')
            .delete()
            .eq('user_id', user.id)

          if (accountsError) {
            deletionResults.steps.push({
              step: 'delete_instagram_accounts',
              status: 'error',
              details: accountsError.message
            })
          } else {
            console.log(`✅ Deleted ${accountsDeleted || 0} Instagram accounts`)
            deletionResults.steps.push({
              step: 'delete_instagram_accounts',
              status: 'success',
              count: accountsDeleted || 0
            })
          }
        } else {
          deletionResults.steps.push({
            step: 'delete_instagram_data',
            status: 'skipped',
            details: 'No Instagram accounts found'
          })
        }
      }

      // Step 5: Delete user account (only for complete deletion)
      if (deletionType === 'complete') {
        console.log('👤 Deleting user account...')
        
        // Use admin client to delete the user completely
        const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id)

        if (deleteUserError) {
          console.error('❌ Error deleting user account:', deleteUserError)
          deletionResults.steps.push({
            step: 'delete_user_account',
            status: 'error',
            details: deleteUserError.message
          })
        } else {
          console.log('✅ User account deleted successfully')
          deletionResults.steps.push({
            step: 'delete_user_account',
            status: 'success',
            details: 'Account completely removed from authentication system'
          })
        }
      } else {
        deletionResults.steps.push({
          step: 'delete_user_account',
          status: 'skipped',
          details: 'Partial deletion - user account preserved'
        })
      }

      deletionResults.deletionCompleted = new Date().toISOString()
      
      // Calculate success rate
      const successfulSteps = deletionResults.steps.filter(step => step.status === 'success').length
      const totalSteps = deletionResults.steps.filter(step => step.status !== 'skipped').length
      
      console.log(`🎯 Deletion completed: ${successfulSteps}/${totalSteps} steps successful`)

      // For complete deletion, also clear any session storage/cookies
      if (deletionType === 'complete' && successfulSteps === totalSteps) {
        console.log('🧹 Account deletion completed successfully')
        
        return NextResponse.json({
          success: true,
          message: 'Your account and all associated data have been permanently deleted.',
          deletionResults,
          redirect: true
        }, { 
          status: 200,
          headers: {
            'Set-Cookie': [
              'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
              'sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
            ].join(', ')
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          message: deletionType === 'instagram_only' ? 
            'Your Instagram data has been deleted.' : 
            'Data deletion completed with some issues.',
          deletionResults
        }, { status: 200 })
      }

    } catch (deletionError) {
      console.error('❌ Error during data deletion:', deletionError)
      deletionResults.steps.push({
        step: 'deletion_process',
        status: 'error',
        details: deletionError instanceof Error ? deletionError.message : String(deletionError)
      })

      return NextResponse.json({
        success: false,
        error: 'Data deletion encountered errors',
        deletionResults
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Data deletion API error:', error)
    return NextResponse.json({ 
      error: 'Failed to process deletion request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET endpoint to show deletion options/status
export async function GET(request: NextRequest) {
  try {
    console.log('ℹ️ Data deletion info API called')
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current data summary
    const { data: instagramAccounts } = await supabase
      .from('instagram_accounts')
      .select('id, username, created_at')
      .eq('user_id', user.id)

    const accountIds = instagramAccounts?.map(acc => acc.id) || []
    
    const { count: snapshotsCount } = await supabase
      .from('daily_snapshots')
      .select('*', { count: 'exact', head: true })
      .in('instagram_account_id', accountIds)

    const { count: logsCount } = await supabase
      .from('sync_logs')
      .select('*', { count: 'exact', head: true })
      .in('instagram_account_id', accountIds)

    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      accountCreated: user.created_at,
      dataToDelete: {
        instagramAccounts: {
          count: instagramAccounts?.length || 0,
          accounts: instagramAccounts?.map(acc => ({
            username: acc.username,
            connectedSince: acc.created_at
          })) || []
        },
        dailySnapshots: {
          count: snapshotsCount || 0,
          description: 'Historical analytics data and growth tracking'
        },
        syncLogs: {
          count: logsCount || 0,
          description: 'Data synchronization and API call logs'
        }
      },
      deletionOptions: {
        instagram_only: {
          name: 'Delete Instagram Data Only',
          description: 'Remove all Instagram account connections and analytics data, but keep your SocialSage account',
          consequence: 'You can reconnect Instagram accounts later'
        },
        complete: {
          name: 'Delete Complete Account',
          description: 'Permanently delete your SocialSage account and all associated data',
          consequence: 'This action cannot be undone. You will need to create a new account to use SocialSage again.'
        }
      }
    })

  } catch (error) {
    console.error('❌ Error fetching deletion info:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch account information',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'