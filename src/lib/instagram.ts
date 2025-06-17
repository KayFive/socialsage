// src/lib/instagram.ts

import { InstagramUser, InstagramMedia, InstagramInsights, InstagramMediaInsights } from '@/types/instagram'

export class InstagramService {
  private baseUrl = 'https://graph.instagram.com'
  
  constructor(private accessToken: string) {}

  async getUserProfile(): Promise<InstagramUser> {
    const response = await fetch(
      `${this.baseUrl}/me?fields=id,username,account_type,media_count&access_token=${this.accessToken}`
    )
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }
    
    return response.json()
  }

  async getUserMedia(limit: number = 25): Promise<InstagramMedia[]> {
    const fields = [
      'id',
      'caption',
      'media_type',
      'media_url',
      'permalink',
      'thumbnail_url',
      'timestamp',
      'username',
      'comments_count',
      'like_count',
      'is_comment_enabled',
      'is_shared_to_feed'
    ].join(',')

    const response = await fetch(
      `${this.baseUrl}/me/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`
    )
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data || []
  }

  async getMediaInsights(mediaId: string): Promise<InstagramMediaInsights> {
    const metrics = [
      'impressions',
      'reach',
      'likes',
      'comments',
      'saves',
      'shares',
      'profile_visits',
      'website_clicks'
    ].join(',')

    const response = await fetch(
      `${this.baseUrl}/${mediaId}/insights?metric=${metrics}&access_token=${this.accessToken}`
    )
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform the insights data
    const insights: any = { media_id: mediaId }
    data.data?.forEach((metric: any) => {
      insights[metric.name] = metric.values[0]?.value || 0
    })
    
    return insights
  }

  async getUserInsights(period: 'day' | 'week' | 'days_28' = 'day'): Promise<InstagramInsights> {
    const metrics = [
      'impressions',
      'reach',
      'profile_views',
      'website_clicks',
      'follows',
      'unfollows'
    ].join(',')

    const response = await fetch(
      `${this.baseUrl}/me/insights?metric=${metrics}&period=${period}&access_token=${this.accessToken}`
    )
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform the insights data
    const insights: any = { date: new Date().toISOString().split('T')[0] }
    data.data?.forEach((metric: any) => {
      insights[metric.name] = metric.values[0]?.value || 0
    })
    
    return insights
  }

  async refreshAccessToken(currentToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(
      `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`
    )
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }
    
    return response.json()
  }

  // Helper method to calculate engagement rate
  static calculateEngagementRate(likes: number, comments: number, followers: number): number {
    if (followers === 0) return 0
    return ((likes + comments) / followers) * 100
  }

  // Helper method to get time-based greeting
  static getTimeBasedGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }
}