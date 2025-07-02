// /app/api/admin/cleanup-instagram-accounts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// TypeScript interfaces
interface InstagramAccount {
  id: string;
  user_id: string;
  username: string | null;
  created_at: string;
  is_active: boolean;
  [key: string]: any;
}

interface AccountWithData {
  account: InstagramAccount;
  dataCount: number;
}

interface CleanupResult {
  userId: string;
  status: 'skipped' | 'consolidated';
  reason?: string;
  accountsFound: number;
  primaryAccountId?: string;
  primaryAccountUsername?: string;
  duplicatesDeactivated?: number;
  dataPointsMigrated?: number;
  totalDataPoints?: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting Instagram account cleanup...')

    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) {
      console.log('❌ Unauthorized cleanup attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin access
    )

    // Get all Instagram accounts grouped by user
    const { data: allAccounts, error: accountsError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .order('user_id', { ascending: true })
      .order('created_at', { ascending: true })

    if (accountsError || !allAccounts) {
      console.error('❌ Error fetching accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    console.log(`📊 Found ${allAccounts.length} total Instagram accounts`)

    // Group accounts by user_id with proper typing
    const accountsByUser = allAccounts.reduce((acc: Record<string, InstagramAccount[]>, account: InstagramAccount) => {
      if (!acc[account.user_id]) {
        acc[account.user_id] = []
      }
      acc[account.user_id].push(account)
      return acc
    }, {} as Record<string, InstagramAccount[]>)

    const results: CleanupResult[] = []
    let totalUsersProcessed = 0
    let totalAccountsConsolidated = 0
    let totalDataPointsMigrated = 0

    console.log(`👥 Processing ${Object.keys(accountsByUser).length} users...`)

    for (const [userId, userAccounts] of Object.entries(accountsByUser) as [string, InstagramAccount[]][]) {
      totalUsersProcessed++
      
      if (userAccounts.length <= 1) {
        console.log(`✅ User ${userId.slice(0, 8)}...: Only 1 account, skipping`)
        results.push({
          userId: userId.slice(0, 8) + '...',
          status: 'skipped',
          reason: 'single_account',
          accountsFound: 1
        })
        continue
      }

      console.log(`\n🔄 User ${userId.slice(0, 8)}...: Found ${userAccounts.length} accounts, analyzing...`)

      // Check each account's data count
      const accountDataCounts: AccountWithData[] = await Promise.all(
        userAccounts.map(async (account: InstagramAccount): Promise<AccountWithData> => {
          const { count, error: countError } = await supabase
            .from('daily_snapshots')
            .select('*', { count: 'exact', head: true })
            .eq('instagram_account_id', account.id)
          
          if (countError) {
            console.error(`⚠️ Error counting data for account ${account.id}:`, countError)
            return { account, dataCount: 0 }
          }
          
          return { account, dataCount: count || 0 }
        })
      )

      // Sort by data count (most data first), then by creation date (oldest first)
      accountDataCounts.sort((a: AccountWithData, b: AccountWithData) => {
        if (b.dataCount !== a.dataCount) {
          return b.dataCount - a.dataCount
        }
        return new Date(a.account.created_at).getTime() - new Date(b.account.created_at).getTime()
      })

      const primaryAccountData = accountDataCounts[0]
      const primaryAccount = primaryAccountData.account
      const duplicateAccountsData = accountDataCounts.slice(1)
      const duplicateAccounts = duplicateAccountsData.map((item: AccountWithData) => item.account)

      console.log(`📊 Primary account: ${primaryAccount.username || 'unknown'} (${primaryAccountData.dataCount} data points)`)
      console.log(`🗑️ Duplicate accounts: ${duplicateAccountsData.map((acc: AccountWithData) => `${acc.account.username || 'unknown'} (${acc.dataCount} points)`).join(', ')}`)

      let totalMigratedForUser = 0

      // Migrate data from duplicate accounts to primary account
      for (const duplicateData of duplicateAccountsData) {
        const duplicateAccount = duplicateData.account
        const duplicateDataCount = duplicateData.dataCount
        
        if (duplicateDataCount > 0) {
          console.log(`🔄 Migrating ${duplicateDataCount} snapshots from ${duplicateAccount.username || 'unknown'} to ${primaryAccount.username || 'unknown'}`)
          
          // First, get the snapshots to understand what we're migrating
          const { data: duplicateSnapshots, error: fetchError } = await supabase
            .from('daily_snapshots')
            .select('snapshot_date')
            .eq('instagram_account_id', duplicateAccount.id)
            .order('snapshot_date', { ascending: true })

          if (fetchError) {
            console.error(`❌ Error fetching snapshots for migration:`, fetchError)
            continue
          }

          if (duplicateSnapshots && duplicateSnapshots.length > 0) {
            const dateRange = `${duplicateSnapshots[0].snapshot_date} to ${duplicateSnapshots[duplicateSnapshots.length - 1].snapshot_date}`
            console.log(`📅 Migrating data from: ${dateRange}`)

            // Update snapshots to point to primary account
            const { error: migrateError } = await supabase
              .from('daily_snapshots')
              .update({ instagram_account_id: primaryAccount.id })
              .eq('instagram_account_id', duplicateAccount.id)

            if (migrateError) {
              console.error(`❌ Error migrating snapshots from ${duplicateAccount.username}:`, migrateError)
            } else {
              console.log(`✅ Successfully migrated ${duplicateSnapshots.length} snapshots`)
              totalMigratedForUser += duplicateSnapshots.length
              totalDataPointsMigrated += duplicateSnapshots.length
            }
          }
        }
      }

      // Mark primary account as active, others as inactive
      const { error: activateError } = await supabase
        .from('instagram_accounts')
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', primaryAccount.id)

      if (activateError) {
        console.error(`❌ Error activating primary account:`, activateError)
      }

      if (duplicateAccounts.length > 0) {
        const { error: deactivateError } = await supabase
          .from('instagram_accounts')
          .update({ 
            is_active: false, 
            updated_at: new Date().toISOString() 
          })
          .in('id', duplicateAccounts.map(acc => acc.id))

        if (deactivateError) {
          console.error(`❌ Error deactivating duplicate accounts:`, deactivateError)
        } else {
          console.log(`✅ Deactivated ${duplicateAccounts.length} duplicate accounts`)
          totalAccountsConsolidated += duplicateAccounts.length
        }
      }

      results.push({
        userId: userId.slice(0, 8) + '...',
        status: 'consolidated',
        primaryAccountId: primaryAccount.id.slice(0, 8) + '...',
        primaryAccountUsername: primaryAccount.username || 'unknown',
        duplicatesDeactivated: duplicateAccounts.length,
        dataPointsMigrated: totalMigratedForUser,
        totalDataPoints: primaryAccountData.dataCount + totalMigratedForUser,
        accountsFound: userAccounts.length
      })

      console.log(`✅ User ${userId.slice(0, 8)}...: Consolidated to ${primaryAccount.username} with ${totalMigratedForUser} migrated data points`)
    }

    console.log('\n🎉 Cleanup completed!')
    console.log(`📊 Final Summary:`)
    console.log(`   Users processed: ${totalUsersProcessed}`)
    console.log(`   Accounts consolidated: ${totalAccountsConsolidated}`)
    console.log(`   Data points migrated: ${totalDataPointsMigrated}`)

    return NextResponse.json({
      success: true,
      summary: {
        usersProcessed: totalUsersProcessed,
        accountsConsolidated: totalAccountsConsolidated,
        dataPointsMigrated: totalDataPointsMigrated
      },
      results
    })

  } catch (error) {
    console.error('❌ Cleanup error:', error)
    return NextResponse.json({ 
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'