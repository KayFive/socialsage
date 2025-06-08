// File: src/services/dataScheduler.ts
// Data scheduler service for your flat structure

import { InstagramDataService } from './instagramDataService';
import { createClient } from '../lib/supabaseServer';

export class DataScheduler {
  private instagramService = new InstagramDataService();

  /**
   * Run daily data collection for all active accounts
   * This should be called by a cron job or scheduled function
   */
  async runDailyCollection() {
    console.log('🚀 Starting daily data collection...');
    
    try {
      // Get all active Instagram accounts
      const accounts = await this.instagramService.getActiveAccountsForSync();
      console.log(`📊 Found ${accounts.length} active accounts to sync`);

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process each account
      for (const account of accounts) {
        try {
          console.log(`📸 Processing account: ${account.instagram_handle} (${account.id})`);
          
          await this.instagramService.createDailySnapshot(account.id);
          results.successful++;
          
          console.log(`✅ Successfully processed ${account.instagram_handle}`);
          
          // Add a small delay between accounts to avoid rate limiting
          await this.delay(1000);
          
        } catch (error) {
          console.error(`❌ Failed to process account ${account.instagram_handle}:`, error);
          results.failed++;
          results.errors.push(`${account.instagram_handle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`🏁 Daily collection completed. Success: ${results.successful}, Failed: ${results.failed}`);
      
      return results;
    } catch (error) {
      console.error('❌ Error in daily collection:', error);
      throw error;
    }
  }

  /**
   * Run data collection for a specific user account
   */
  async runUserDataCollection(userId: string) {
    console.log(`🔄 Running data collection for user: ${userId}`);
    
    try {
      const supabase = await createClient();
      
      // Get user's Instagram accounts
      const { data: accounts, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to get user accounts: ${error.message}`);
      }

      if (!accounts || accounts.length === 0) {
        console.log('No active Instagram accounts found for user');
        return { successful: 0, failed: 0, errors: [] };
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const account of accounts) {
        try {
          console.log(`🔄 Processing account: ${account.instagram_handle}`);
          await this.instagramService.createDailySnapshot(account.id);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push(`${account.instagram_handle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    } catch (error) {
      console.error(`❌ Error in user data collection for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if we need to refresh access tokens
   */
  async checkAndRefreshTokens() {
    console.log('🔑 Checking for tokens that need refresh...');
    
    try {
      const supabase = await createClient();
      
      // Get accounts with tokens expiring in the next 24 hours
      const expiryThreshold = new Date();
      expiryThreshold.setHours(expiryThreshold.getHours() + 24);
      
      const { data: accounts, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('is_active', true)
        .lt('token_expires_at', expiryThreshold.toISOString());

      if (error) {
        console.error('Error fetching accounts for token refresh:', error);
        return;
      }

      console.log(`Found ${accounts?.length || 0} accounts needing token refresh`);

      if (!accounts || accounts.length === 0) {
        return;
      }

      for (const account of accounts) {
        try {
          await this.refreshInstagramToken(account);
        } catch (error) {
          console.error(`Failed to refresh token for ${account.instagram_handle}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in token refresh check:', error);
    }
  }

  /**
   * Refresh Instagram access token
   */
  private async refreshInstagramToken(account: any) {
    if (!account.refresh_token) {
      console.warn(`No refresh token available for ${account.instagram_handle}`);
      return;
    }

    try {
      const tokenData = await this.instagramService.refreshAccessToken(account.refresh_token);
      
      // Update the account with new token
      await this.instagramService.updateAccountToken(
        account.id, 
        tokenData.access_token, 
        tokenData.expires_in
      );

      console.log(`✅ Token refreshed for ${account.instagram_handle}`);
      
    } catch (error) {
      console.error(`❌ Failed to refresh token for ${account.instagram_handle}:`, error);
      
      // If refresh fails, mark account as inactive
      const supabase = await createClient();
      
      await supabase
        .from('instagram_accounts')
        .update({ is_active: false })
        .eq('id', account.id);
    }
  }

  /**
   * Utility function to add delay between API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync status for all accounts
   */
  async getSyncStatus() {
    try {
      const supabase = await createClient();
      
      // Get last sync status for each account
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select(`
          id,
          instagram_handle,
          last_sync_at,
          is_active,
          sync_logs (
            status,
            started_at,
            completed_at,
            error_message
          )
        `)
        .order('last_sync_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get sync status: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  /**
   * Get detailed sync statistics
   */
  async getSyncStatistics() {
    try {
      const supabase = await createClient();
      
      // Get sync statistics for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: syncLogs, error } = await supabase
        .from('sync_logs')
        .select('*')
        .gte('started_at', sevenDaysAgo.toISOString());

      if (error) {
        throw new Error(`Failed to get sync statistics: ${error.message}`);
      }

      const stats = {
        totalSyncs: syncLogs?.length || 0,
        successfulSyncs: syncLogs?.filter(log => log.status === 'completed').length || 0,
        failedSyncs: syncLogs?.filter(log => log.status === 'failed').length || 0,
        avgRecordsProcessed: 0,
        successRate: 0
      };

      if (stats.totalSyncs > 0) {
        stats.successRate = (stats.successfulSyncs / stats.totalSyncs) * 100;
        const successfulLogs = syncLogs?.filter(log => log.status === 'completed') || [];
        if (successfulLogs.length > 0) {
          stats.avgRecordsProcessed = successfulLogs.reduce((sum, log) => 
            sum + (log.records_processed || 0), 0) / successfulLogs.length;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting sync statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old sync logs (keep last 30 days)
   */
  async cleanupOldSyncLogs() {
    try {
      const supabase = await createClient();
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await supabase
        .from('sync_logs')
        .delete()
        .lt('started_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error cleaning up sync logs:', error);
      } else {
        console.log('✅ Old sync logs cleaned up');
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }

  /**
   * Get accounts that haven't synced recently
   */
  async getStaleAccounts(hoursThreshold: number = 25) {
    try {
      const supabase = await createClient();
      
      const thresholdTime = new Date();
      thresholdTime.setHours(thresholdTime.getHours() - hoursThreshold);
      
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('is_active', true)
        .or(`last_sync_at.is.null,last_sync_at.lt.${thresholdTime.toISOString()}`);

      if (error) {
        throw new Error(`Failed to get stale accounts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting stale accounts:', error);
      throw error;
    }
  }

  /**
   * Force sync for stale accounts
   */
  async forceSyncStaleAccounts() {
    console.log('🔄 Checking for stale accounts...');
    
    try {
      const staleAccounts = await this.getStaleAccounts(25); // 25 hours threshold
      
      if (staleAccounts.length === 0) {
        console.log('✅ No stale accounts found');
        return { processed: 0, successful: 0, failed: 0 };
      }

      console.log(`📊 Found ${staleAccounts.length} stale accounts`);

      const results = {
        processed: staleAccounts.length,
        successful: 0,
        failed: 0
      };

      for (const account of staleAccounts) {
        try {
          console.log(`🔄 Force syncing stale account: ${account.instagram_handle}`);
          await this.instagramService.createDailySnapshot(account.id);
          results.successful++;
          
          // Add delay to avoid rate limiting
          await this.delay(2000);
        } catch (error) {
          console.error(`❌ Failed to sync stale account ${account.instagram_handle}:`, error);
          results.failed++;
        }
      }

      console.log(`🏁 Stale account sync completed. Success: ${results.successful}, Failed: ${results.failed}`);
      return results;
    } catch (error) {
      console.error('❌ Error in stale account sync:', error);
      throw error;
    }
  }
}