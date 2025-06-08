// /services/instagramService.js
import { createBrowserClient } from '@/lib/supabase';

export class InstagramService {
  constructor() {
    this.supabase = createBrowserClient();
  }

  // Get all Instagram connections for a user
  async getUserConnections(userId) {
    try {
      console.log('📱 Fetching connections for user:', userId);
      
      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching connections:', error);
        throw error;
      }

      console.log('✅ Fetched connections:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching Instagram connections:', error);
      return [];
    }
  }

  // Get primary Instagram connection (first active one for now)
  async getPrimaryConnection(userId) {
    try {
      console.log('⭐ Fetching primary connection for user:', userId);
      
      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error fetching primary connection:', error);
        throw error;
      }
      
      console.log('✅ Primary connection:', data);
      return data || null;
    } catch (error) {
      console.error('Error fetching primary Instagram connection:', error);
      return null;
    }
  }

  // Add new Instagram connection (this integrates with your existing storeInstagramAccount)
  async addConnection(userId, instagramData) {
    try {
      console.log('➕ Adding new connection for user:', userId, instagramData);
      
      // Check if this Instagram account is already connected
      const { data: existing } = await this.supabase
        .from('instagram_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('instagram_id', instagramData.instagram_user_id)
        .eq('is_active', true)
        .single();

      if (existing) {
        throw new Error('This Instagram account is already connected');
      }

      // Calculate token expiration (60 days for long-lived tokens)
      const tokenExpiresAt = new Date(Date.now() + 5184000 * 1000).toISOString();

      const connectionData = {
        user_id: userId,
        instagram_id: instagramData.instagram_user_id,
        instagram_handle: instagramData.instagram_username,
        access_token: instagramData.access_token,
        token_expires_at: tokenExpiresAt,
        is_active: true
      };

      console.log('💾 Inserting connection data:', connectionData);

      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .insert(connectionData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting connection:', error);
        throw error;
      }

      console.log('✅ Successfully added connection:', data);
      return data;
    } catch (error) {
      console.error('Error adding Instagram connection:', error);
      throw error;
    }
  }

  // Disconnect (soft delete) an Instagram connection
  async disconnectAccount(userId, connectionId) {
    try {
      console.log('🔄 Attempting to disconnect account:', { userId, connectionId });
      
      // Verify the connection exists first
      const { data: existingConnection, error: selectError } = await this.supabase
        .from('instagram_accounts')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', userId)
        .single();

      if (selectError) {
        console.error('❌ Error finding connection:', selectError);
        throw new Error(`Connection not found: ${selectError.message}`);
      }

      if (!existingConnection) {
        throw new Error('Instagram connection not found or does not belong to this user');
      }

      console.log('✅ Found connection to disconnect:', existingConnection);

      // Soft delete by setting is_active to false
      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .update({ 
          is_active: false,
          access_token: null, // Clear the token for security
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('❌ Error updating connection:', error);
        throw new Error(`Failed to disconnect account: ${error.message}`);
      }

      console.log('✅ Successfully disconnected account:', data);
      return true;
    } catch (error) {
      console.error('❌ Error disconnecting Instagram account:', error);
      throw error;
    }
  }

  // Update connection data (followers, etc.)
  async updateConnectionData(connectionId, updateData) {
    try {
      console.log('🔄 Updating connection data:', { connectionId, updateData });
      
      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select();

      if (error) {
        console.error('❌ Error updating connection:', error);
        throw error;
      }

      console.log('✅ Successfully updated connection:', data);
      return true;
    } catch (error) {
      console.error('Error updating connection data:', error);
      throw error;
    }
  }

  // Get connection by Instagram user ID
  async getConnectionByInstagramId(userId, instagramUserId) {
    try {
      console.log('🔍 Finding connection by Instagram ID:', { userId, instagramUserId });
      
      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('instagram_id', instagramUserId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error finding connection by Instagram ID:', error);
        throw error;
      }
      
      console.log('✅ Found connection by Instagram ID:', data);
      return data || null;
    } catch (error) {
      console.error('Error fetching connection by Instagram ID:', error);
      return null;
    }
  }

  // Set primary connection (add is_primary column to your table if you want this feature)
  async setPrimaryConnection(userId, connectionId) {
    try {
      console.log('⭐ Setting primary connection:', { userId, connectionId });
      // For now, this is a placeholder since your current table doesn't have is_primary
      // You could add this column later if needed
      console.log(`✅ Setting primary connection ${connectionId} for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error setting primary connection:', error);
      throw error;
    }
  }

  // Debug method to help troubleshoot issues
  async debugConnection(userId, connectionId) {
    try {
      console.log('🔍 Debug - User ID:', userId);
      console.log('🔍 Debug - Connection ID:', connectionId);
      
      // Test basic connection to Supabase
      const { data: testData, error: testError } = await this.supabase
        .from('instagram_accounts')
        .select('count(*)')
        .limit(1);
      
      console.log('🔍 Debug - Supabase connection test:', { testData, testError });
      
      // Try to find the specific connection
      const { data: connectionData, error: connectionError } = await this.supabase
        .from('instagram_accounts')
        .select('*')
        .eq('id', connectionId);
      
      console.log('🔍 Debug - Connection search result:', { connectionData, connectionError });
      
      // Try to find connections for this user
      const { data: userConnections, error: userError } = await this.supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId);
      
      console.log('🔍 Debug - User connections:', { userConnections, userError });
      
      return { connectionData, userConnections };
    } catch (error) {
      console.error('🔍 Debug error:', error);
      return { error };
    }
  }

  // Test Supabase connection and permissions
  async testConnection() {
    try {
      console.log('🧪 Testing Supabase connection...');
      
      const { data, error } = await this.supabase
        .from('instagram_accounts')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Supabase connection test passed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase connection test error:', error);
      return { success: false, error };
    }
  }
}