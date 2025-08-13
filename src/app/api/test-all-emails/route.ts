// app/api/test-all-emails/route.ts - Debug version
import { NextResponse } from 'next/server';
import { sendWelcomeEmail, sendFirstInsightsEmail, sendAdvancedFeaturesEmail, sendMasteryEmail } from '@/lib/email-templates';

export async function GET() {
  const testEmail = 'krivory5@gmail.com';
  const testUser = 'TestUser';
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  
  try {
    // Test Email 1: Welcome
    console.log('Testing welcome email...');
    const welcome = await sendWelcomeEmail(testEmail, testUser, testUserId);
    console.log('Welcome result:', welcome);
    
    // Test Email 2: Insights (with sample data)
    console.log('Testing insights email...');
    const insights = await sendFirstInsightsEmail(testEmail, testUser, {
      followers: 1234,
      growthRate: '+2.1%',
      engagementRate: '4.8%',
      topPostReach: 2100,
      totalPosts: 45
    }, testUserId);
    console.log('Insights result:', insights);
    
    // Test Email 3: Advanced Features (with sample data)
    console.log('Testing advanced email...');
    const advanced = await sendAdvancedFeaturesEmail(testEmail, testUser, {
      bestPostingTime: '7-9 PM',
      optimalFrequency: '3-4 posts per week',
      weeklyGrowth: '+2.1%',
      contentInsights: 'Your educational posts get 2.3x more engagement than lifestyle posts'
    }, testUserId);
    console.log('Advanced result:', advanced);
    
    // Test Email 4: Mastery (with sample data)
    console.log('Testing mastery email...');
    const mastery = await sendMasteryEmail(testEmail, testUser, {
      followerGrowth: 89,
      engagementImprovement: '+15%',
      totalReach: 45200,
      topContentType: 'Educational',
      growthPercentile: 85
    }, testUserId);
    console.log('Mastery result:', mastery);
    
    return NextResponse.json({
      welcome: { success: welcome.success, error: welcome.error || null },
      insights: { success: insights.success, error: insights.error || null },
      advanced: { success: advanced.success, error: advanced.error || null },
      mastery: { success: mastery.success, error: mastery.error || null }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Test all emails error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}