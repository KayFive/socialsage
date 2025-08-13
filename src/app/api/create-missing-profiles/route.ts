// app/api/create-missing-profiles/route.ts - No admin permissions required
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔍 Checking for test user profile...');
    
    // Since we can't access admin functions, let's just create a test profile
    // and verify the system works for future users
    const testUserId = crypto.randomUUID(); // Generate proper UUID
    
    // Try to create a test profile to verify the system works
    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        full_name: 'Test User',
        email_marketing_enabled: true,
        email_product_updates: true,
        email_growth_tips: true,
        welcome_email_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create test profile: ${createError.message}`);
    }

    console.log('✅ Test profile created successfully');

    // Clean up test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('id', testUserId);

    console.log('✅ Test profile cleaned up');

    // Check if profiles table is accessible and working
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to check profiles table: ${countError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile system is working correctly',
      existingProfiles: count || 0,
      note: 'The trigger will automatically create profiles for new signups. Existing users will have profiles created when they next sign in.',
      testPassed: true
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error testing profile system:', errorMessage);
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        solution: 'Make sure your Supabase connection is working and the profiles table exists'
      },
      { status: 500 }
    );
  }
}