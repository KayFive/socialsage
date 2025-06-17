// src/lib/auth.ts - Updated with modern Supabase SSR
import { createBrowserClient } from '@supabase/ssr'
import { InstagramAccount } from '@/types/instagram'

// Create modern Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class AuthService {
  static getInstagramAuthUrl(userId?: string): string {
    // Get environment variables with proper fallbacks
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
    // TEMPORARY: Hardcode ngrok URL for testing
    const redirectUri = 'https://b595-2600-1700-ab90-6580-a569-6a8f-59ba-37ad.ngrok-free.app/auth/instagram/callback'
    
    console.log('🔧 Instagram Auth Config:')
    console.log('- Client ID:', clientId || 'MISSING')
    console.log('- Redirect URI:', redirectUri)
    console.log('- User ID for state:', userId || 'none')
    
    if (!clientId) {
      console.error('❌ NEXT_PUBLIC_INSTAGRAM_CLIENT_ID is not set!')
      throw new Error('Instagram Client ID not configured')
    }
    
    // Using Instagram Business API (NEW - not deprecated)
    const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish'
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code',
      state: userId ? `${crypto.randomUUID()}_USER_${userId}` : crypto.randomUUID()
    })
    
    // Instagram Business API URL (NOT Basic Display API)
    const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`
    console.log('🔗 Generated Instagram Auth URL:', authUrl)
    return authUrl
  }

  static async getActiveInstagramAccount(userId: string): Promise<InstagramAccount | null> {
    console.log('🔍 AuthService: Fetching Instagram account for user:', userId)
    
    if (!userId) {
      console.error('❌ No user ID provided')
      return null
    }
    
    try {
      console.log('📡 Making Supabase query...')
      
      // Use maybeSingle() instead of single() to avoid errors when no records exist
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // This won't throw error if no records found

      console.log('📊 AuthService: Query result:')
      console.log('- Data:', data)
      console.log('- Error:', error)

      if (error) {
        console.error('❌ AuthService: Database error:', error)
        return null
      }

      if (data) {
        console.log('✅ AuthService: Found Instagram account:', data.username)
        return data as InstagramAccount
      }

      console.log('📭 AuthService: No Instagram account found (normal for new users)')
      return null

    } catch (error) {
      console.error('❌ AuthService: Unexpected error:', error)
      return null
    }
  }

  static async getCurrentUser() {
    console.log('👤 Getting current user...')
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.log('❌ AuthService: Error getting user:', error.message)
        return null
      }
      
      if (user) {
        console.log('✅ AuthService: Found user:', user.id)
        return user
      }
      
      console.log('📭 AuthService: No user found')
      return null
    } catch (error) {
      console.error('💥 AuthService: Unexpected error getting user:', error)
      return null
    }
  }

  static async exchangeCodeForToken(code: string): Promise<any> {
    console.log('🔄 Exchanging authorization code for token...')
    
    try {
      const response = await fetch('/api/auth/instagram/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Token exchange failed:', response.status, errorText)
        throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`)
      }

      const tokenData = await response.json()
      console.log('✅ Token exchange successful')
      return tokenData

    } catch (error) {
      console.error('❌ Token exchange error:', error)
      throw error
    }
  }

  static async saveInstagramAccount(userId: string, accountData: any): Promise<InstagramAccount> {
    console.log('💾 Saving Instagram account for user:', userId)
    console.log('📊 Account data:', accountData)
    
    try {
      // Use server-side API instead of direct client call to bypass RLS
      const response = await fetch('/api/auth/instagram/save-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          accountData
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Save account API failed:', response.status, errorText)
        throw new Error(`Failed to save Instagram account: ${errorText}`)
      }

      const savedAccount = await response.json()
      console.log('✅ Instagram account saved successfully via API')
      return savedAccount

    } catch (error) {
      console.error('❌ Save Instagram account error:', error)
      throw error
    }
  }

  static async refreshInstagramToken(accountId: string): Promise<void> {
    console.log('🔄 Refreshing Instagram token for account:', accountId)
    
    try {
      const response = await fetch('/api/auth/instagram/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Token refresh failed:', response.status, errorText)
        throw new Error(`Failed to refresh token: ${response.status}`)
      }

      console.log('✅ Token refreshed successfully')

    } catch (error) {
      console.error('❌ Token refresh error:', error)
      throw error
    }
  }

  static async signOut(): Promise<void> {
    console.log('🚪 Signing out...')
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
        throw new Error(`Sign out failed: ${error.message}`)
      }
      
      // Clear any local storage or session data
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('✅ Signed out successfully')
      
    } catch (error) {
      console.error('❌ Sign out error:', error)
      throw error
    }
  }

  // Helper method to get auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Helper method to get current session
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error getting session:', error)
        return null
      }
      
      return session
    } catch (error) {
      console.error('💥 Unexpected error getting session:', error)
      return null
    }
  }
}

// Export the supabase client for direct use if needed
export { supabase }