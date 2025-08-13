// lib/email-templates.ts - Complete file with enhanced profile creation
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function for email footer with unsubscribe links
const generateEmailFooter = (unsubscribeToken: string) => `
  <div style="background: #F9FAFB; padding: 20px; margin-top: 30px; border-top: 1px solid #E5E7EB; text-align: center;">
    <p style="margin: 0 0 10px 0; color: #6B7280; font-size: 12px;">
      You're receiving this email because you signed up for SocialSage.
    </p>
    <p style="margin: 0; color: #6B7280; font-size: 12px;">
      <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/api/unsubscribe?token=${unsubscribeToken}&type=all" 
         style="color: #6B7280; text-decoration: underline;">
        Unsubscribe from all emails
      </a>
      &nbsp;|&nbsp;
      <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/email-preferences?token=${unsubscribeToken}" 
         style="color: #6B7280; text-decoration: underline;">
         Manage email preferences
      </a>
    </p>
    <p style="margin: 10px 0 0 0; color: #9CA3AF; font-size: 11px;">
      SocialSage • Instagram Analytics & Growth
    </p>
  </div>
`;

// ✅ NEW: Helper function to ensure profile exists (graceful version)
const ensureProfileExists = async (userId: string, userName?: string): Promise<void> => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      console.log(`📝 Attempting to create missing profile for user ${userId}`);
      
      // Try to create the missing profile, but don't fail if it doesn't work
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userName || 'User',
          email_marketing_enabled: true,
          email_product_updates: true,
          email_growth_tips: true,
          welcome_email_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.log('ℹ️ Could not create profile (RLS or permissions), continuing anyway:', createError.message);
        // Don't throw - we'll continue with default permissions
      } else {
        console.log('✅ Profile created successfully');
      }
    } else {
      console.log('✅ Profile already exists');
    }
  } catch (error) {
    console.log('ℹ️ Profile check failed, continuing anyway:', error);
    // Don't throw - we'll continue with default permissions
  }
};

// Helper function to get or create unsubscribe token
const getUnsubscribeToken = async (userId: string): Promise<string> => {
  try {
    // First, try to get existing token
    const { data: profile } = await supabase
      .from('profiles')
      .select('unsubscribe_token')
      .eq('id', userId)
      .single();
    
    let unsubscribeToken = profile?.unsubscribe_token;
    
    // If no token exists, create one
    if (!unsubscribeToken) {
      unsubscribeToken = crypto.randomUUID();
      await supabase
        .from('profiles')
        .update({ unsubscribe_token: unsubscribeToken })
        .eq('id', userId);
    }
    
    return unsubscribeToken;
  } catch (error) {
    console.error('Error getting unsubscribe token:', error);
    // Return a fallback token if database fails
    return crypto.randomUUID();
  }
};

// ✅ ENHANCED: Helper function to check if user wants emails
export const canSendEmailToUser = async (userId: string, emailType: 'marketing' | 'product' | 'tips' = 'marketing'): Promise<boolean> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_marketing_enabled, email_product_updates, email_growth_tips, unsubscribed_at')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.log(`No profile found for user ${userId}, defaulting to allow emails`);
      return true; // Default to allowing emails if no profile exists
    }

    if (profile.unsubscribed_at) {
      console.log(`User ${userId} has unsubscribed from all emails`);
      return false; // User unsubscribed from all emails
    }

    // Check specific email type preferences
    switch (emailType) {
      case 'marketing':
        return profile.email_marketing_enabled !== false; // Default to true if null
      case 'product':
        return profile.email_product_updates !== false; // Default to true if null
      case 'tips':
        return profile.email_growth_tips !== false; // Default to true if null
      default:
        return profile.email_marketing_enabled !== false; // Default to true if null
    }
  } catch (error) {
    console.error('Error checking email preferences:', error);
    // Default to allowing emails if we can't check preferences
    return true;
  }
};

// EMAIL 1: Welcome & Instagram Connection (Day 1)
export const sendWelcomeEmail = async (
  userEmail: string, 
  userName: string,
  userId: string
) => {
  try {
    // ✅ NEW: Ensure profile exists before checking permissions
    await ensureProfileExists(userId, userName);

    // Check if user wants marketing emails
    const canSend = await canSendEmailToUser(userId, 'marketing');
    if (!canSend) {
      console.log(`User ${userId} has unsubscribed from marketing emails`);
      return { success: false, error: 'User unsubscribed from marketing emails', skipped: true };
    }

    // Get unsubscribe token
    const unsubscribeToken = await getUnsubscribeToken(userId);

    const { data, error } = await resend.emails.send({
      from: 'SocialSage <noreply@resend.dev>',
      to: [userEmail],
      subject: 'Welcome to SocialSage! Your Instagram growth starts now 🚀',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to SocialSage! 👋</h1>
            <p style="color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;">Your Instagram growth journey starts now</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
              Hi ${userName}! 🎉
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
              You're about to discover insights about your Instagram that you've never seen before.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" 
                 style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Connect Your Instagram →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; text-align: center; margin: 25px 0 0 0;">
              Ready to grow your Instagram like never before? 💜<br>
              <span style="color: #9CA3AF;">P.S. Your data is private and never shared with third parties</span>
            </p>
          </div>
          
          <!-- Unsubscribe footer -->
          ${generateEmailFooter(unsubscribeToken)}
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/api/unsubscribe?token=${unsubscribeToken}&type=all>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error };
    }

    console.log('✅ Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error };
  }
};

// EMAIL 2: First Insights Available (Day 3)
export const sendFirstInsightsEmail = async (
  userEmail: string,
  userName: string,
  userData: {
    followers: number;
    growthRate: string;
    engagementRate: string;
    topPostReach: number;
    totalPosts: number;
  },
  userId: string
) => {
  try {
    // ✅ NEW: Ensure profile exists
    await ensureProfileExists(userId, userName);

    // Check if user wants marketing emails
    const canSend = await canSendEmailToUser(userId, 'marketing');
    if (!canSend) {
      console.log(`User ${userId} has unsubscribed from marketing emails`);
      return { success: false, error: 'User unsubscribed from marketing emails', skipped: true };
    }

    // Get unsubscribe token
    const unsubscribeToken = await getUnsubscribeToken(userId);

    const { data, error } = await resend.emails.send({
      from: 'SocialSage <noreply@resend.dev>',
      to: [userEmail],
      subject: `${userName}, your first Instagram insights are ready! 📊`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #0891B2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Your Instagram Insights Are Ready! 📊</h1>
            <p style="color: #A7F3D0; margin: 10px 0 0 0; font-size: 14px;">Based on ${userData.totalPosts} posts analyzed</p>
          </div>
          
          <!-- Real Data Preview -->
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hi ${userName}!
            </p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
              We've been analyzing your Instagram account and the results are fascinating! Here's what we discovered:
            </p>
            
            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
              <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #059669;">${userData.followers.toLocaleString()}</div>
                <div style="font-size: 14px; color: #6B7280;">Followers</div>
                <div style="font-size: 12px; color: #16A34A; margin-top: 5px;">${userData.growthRate} growth</div>
              </div>
              <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #0891B2;">${userData.engagementRate}</div>
                <div style="font-size: 14px; color: #6B7280;">Engagement Rate</div>
                <div style="font-size: 12px; color: #0891B2; margin-top: 5px;">${userData.engagementRate > '3%' ? 'above average! Keep up the great work.' : 'ready for optimization. We found specific improvements you can make.'}</div>
              </div>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" 
                 style="background: linear-gradient(135deg, #059669 0%, #0891B2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                View Your Full Analytics →
              </a>
            </div>
            
            <p style="font-size: 13px; color: #6B7280; text-align: center; margin-top: 20px;">
              More insights coming as we collect more data over the next few days! 📈
            </p>
          </div>
          
          <!-- Unsubscribe footer -->
          ${generateEmailFooter(unsubscribeToken)}
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/api/unsubscribe?token=${unsubscribeToken}&type=all>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('❌ Failed to send insights email:', error);
      return { success: false, error };
    }

    console.log('✅ Insights email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending insights email:', error);
    return { success: false, error };
  }
};

// EMAIL 3: Advanced Features Unlock (Day 7)
export const sendAdvancedFeaturesEmail = async (
  userEmail: string,
  userName: string,
  userData: {
    bestPostingTime: string;
    optimalFrequency: string;
    weeklyGrowth: string;
    contentInsights: string;
  },
  userId: string
) => {
  try {
    // ✅ NEW: Ensure profile exists
    await ensureProfileExists(userId, userName);

    // Check if user wants tips emails
    const canSend = await canSendEmailToUser(userId, 'tips');
    if (!canSend) {
      console.log(`User ${userId} has unsubscribed from tips emails`);
      return { success: false, error: 'User unsubscribed from tips emails', skipped: true };
    }

    // Get unsubscribe token
    const unsubscribeToken = await getUnsubscribeToken(userId);

    const { data, error } = await resend.emails.send({
      from: 'SocialSage <noreply@resend.dev>',
      to: [userEmail],
      subject: `${userName}, unlock your posting optimization tools! 🚀`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #DC2626 0%, #EA580C 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Advanced Features Unlocked! 🚀</h1>
            <p style="color: #FED7AA; margin: 10px 0 0 0; font-size: 14px;">7 days of data analysis complete</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              ${userName}, after a week of analyzing your content, we've unlocked personalized optimization insights!
            </p>
            
            <!-- Insights -->
            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #92400E; font-size: 18px;">📅 Your Optimal Posting Schedule</h3>
              <p style="margin: 0; color: #451A03;"><strong>Best time:</strong> ${userData.bestPostingTime}</p>
              <p style="margin: 5px 0 0 0; color: #451A03;"><strong>Frequency:</strong> ${userData.optimalFrequency}</p>
            </div>
            
            <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 18px;">📈 Growth Insights</h3>
              <p style="margin: 0; color: #1E3A8A;">${userData.contentInsights}</p>
              <p style="margin: 10px 0 0 0; color: #1E3A8A;"><strong>Weekly growth:</strong> ${userData.weeklyGrowth}</p>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" 
                 style="background: linear-gradient(135deg, #DC2626 0%, #EA580C 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                See All Advanced Features →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; text-align: center; margin: 25px 0 0 0;">
              These insights get more accurate every day 💜
            </p>
          </div>
          
          <!-- Unsubscribe footer -->
          ${generateEmailFooter(unsubscribeToken)}
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/api/unsubscribe?token=${unsubscribeToken}&type=all>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('❌ Failed to send advanced features email:', error);
      return { success: false, error };
    }

    console.log('✅ Advanced features email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending advanced features email:', error);
    return { success: false, error };
  }
};

// EMAIL 4: Mastery & Results (Day 14)
export const sendMasteryEmail = async (
  userEmail: string,
  userName: string,
  userData: {
    followerGrowth: number;
    engagementImprovement: string;
    totalReach: number;
    topContentType: string;
    growthPercentile: number;
  },
  userId: string
) => {
  try {
    // ✅ NEW: Ensure profile exists
    await ensureProfileExists(userId, userName);

    // Check if user wants tips emails
    const canSend = await canSendEmailToUser(userId, 'tips');
    if (!canSend) {
      console.log(`User ${userId} has unsubscribed from tips emails`);
      return { success: false, error: 'User unsubscribed from tips emails', skipped: true };
    }

    // Get unsubscribe token
    const unsubscribeToken = await getUnsubscribeToken(userId);

    const { data, error } = await resend.emails.send({
      from: 'SocialSage <noreply@resend.dev>',
      to: [userEmail],
      subject: `🌟 ${userName}, look at your incredible 2-week progress!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #7C3AED 100%); padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">You're Crushing It! 🌟</h1>
            <p style="color: #A7F3D0; margin: 10px 0 0 0; font-size: 16px;">2 weeks of Instagram growth mastery</p>
          </div>
          
          <div style="background: white; padding: 35px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
              ${userName}, your results speak for themselves!
            </p>
            
            <!-- Results Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
              <div style="background: #F0FDF4; padding: 25px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #059669;">+${userData.followerGrowth}</div>
                <div style="font-size: 14px; color: #6B7280;">New Followers</div>
              </div>
              <div style="background: #FAF5FF; padding: 25px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #7C3AED;">${userData.engagementImprovement}</div>
                <div style="font-size: 14px; color: #6B7280;">Engagement Boost</div>
              </div>
            </div>
            
            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #92400E; font-size: 16px;">
                🎯 Your <strong>${userData.topContentType.toLowerCase()}</strong> content is performing amazingly!
              </p>
              <p style="margin: 10px 0 0 0; color: #92400E; font-size: 14px;">
                You're in the top <strong>${userData.growthPercentile}%</strong> of creators in your niche
              </p>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" 
                 style="background: linear-gradient(135deg, #059669 0%, #7C3AED 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                View Full Growth Report →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; text-align: center; margin: 25px 0 0 0;">
              Keep going - the best is yet to come! 💜<br>
              <span style="color: #9CA3AF;">P.S. Reply with your biggest win so far - we love hearing success stories!</span>
            </p>
          </div>
          
          <!-- Unsubscribe footer -->
          ${generateEmailFooter(unsubscribeToken)}
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/api/unsubscribe?token=${unsubscribeToken}&type=all>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('❌ Failed to send mastery email:', error);
      return { success: false, error };
    }

    console.log('✅ Mastery email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending mastery email:', error);
    return { success: false, error };
  }
};

// BONUS EMAIL: Re-engagement (for inactive users after 5 days)
export const sendReEngagementEmail = async (
  userEmail: string,
  userName: string,
  daysSinceLastVisit: number,
  userId: string
) => {
  try {
    // ✅ NEW: Ensure profile exists
    await ensureProfileExists(userId, userName);

    // Check if user wants marketing emails
    const canSend = await canSendEmailToUser(userId, 'marketing');
    if (!canSend) {
      console.log(`User ${userId} has unsubscribed from marketing emails`);
      return { success: false, error: 'User unsubscribed from marketing emails', skipped: true };
    }

    // Get unsubscribe token
    const unsubscribeToken = await getUnsubscribeToken(userId);

    const { data, error } = await resend.emails.send({
      from: 'SocialSage <noreply@resend.dev>',
      to: [userEmail],
      subject: `${userName}, your Instagram insights are piling up! 📊`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">We Miss You! 📊</h1>
            <p style="color: #FED7AA; margin: 10px 0 0 0; font-size: 14px;">Your insights are waiting...</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hi ${userName}! 👋
            </p>
            <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
              It's been ${daysSinceLastVisit} days since you last checked your SocialSage insights, and we've been busy collecting valuable data about your Instagram performance!
            </p>
            
            <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #991B1B; text-align: center; font-size: 16px;">
                ⏰ <strong>Don't miss out on your growth opportunities!</strong>
              </p>
            </div>
            
            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" 
                 style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Check Your Latest Insights →
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6B7280; text-align: center; margin: 25px 0 0 0;">
              We're here whenever you're ready to grow! 💜
            </p>
          </div>
          
          <!-- Unsubscribe footer -->
          ${generateEmailFooter(unsubscribeToken)}
        </div>
      `,
      headers: {
        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/api/unsubscribe?token=${unsubscribeToken}&type=all>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error('❌ Failed to send re-engagement email:', error);
      return { success: false, error };
    }

    console.log('✅ Re-engagement email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending re-engagement email:', error);
    return { success: false, error };
  }
};