// app/api/send-welcome-email/route.ts - Enhanced with profile creation
import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-templates';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, userId } = await request.json();

    if (!userEmail || !userName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, userName, userId' },
        { status: 400 }
      );
    }

    console.log('📧 Welcome email request:', { userEmail, userName, userId });

    // ✅ NEW: Ensure profile exists before sending email
    console.log('🔍 Checking if profile exists...');
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      console.log('📝 Profile not found, creating one...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userName,
          email_marketing_enabled: true,
          email_product_updates: true,
          email_growth_tips: true,
          welcome_email_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError);
        // Continue anyway - the email system will default to allowing emails
      } else {
        console.log('✅ Profile created successfully');
      }
    } else {
      console.log('✅ Profile already exists');
    }

    // Send the welcome email
    const result = await sendWelcomeEmail(userEmail, userName, userId);

    if (result.success) {
      // Mark welcome email as sent
      await supabase
        .from('profiles')
        .update({ 
          welcome_email_sent: true,
          last_email_sent: new Date().toISOString()
        })
        .eq('id', userId);
      
      console.log('✅ Welcome email sent and recorded');
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Welcome email API error:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}