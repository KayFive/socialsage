import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (
  userEmail: string, 
  userName: string,
  userId: string
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'SocialSage <noreply@send.socialsageapp.com>',
      to: [userEmail],
      subject: 'Welcome to SocialSage! Let\'s connect your Instagram 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to SocialSage! 👋</h1>
            <p style="color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;">Your Instagram growth journey starts now</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
              Hi ${userName}! 🚀
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
              We're excited you've joined SocialSage! You're about to unlock AI-powered insights that will help you understand and grow your Instagram presence like never before.
            </p>
            
            <!-- What's Next Box -->
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1F2937; font-size: 18px;">What happens next:</h3>
              <div style="color: #4B5563; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">📸 Connect your Instagram account (takes 30 seconds)</p>
                <p style="margin: 0 0 8px 0;">⏱️ We'll start collecting your data (24-48 hours)</p>
                <p style="margin: 0 0 0 0;">📊 Get your first AI insights and growth recommendations</p>
              </div>
            </div>
            
            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" 
                 style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Connect Your Instagram Account →
              </a>
            </div>
            
            <!-- Privacy Notice -->
            <div style="background: #EEF2FF; padding: 15px; border-radius: 6px; margin-top: 25px;">
              <p style="margin: 0; font-size: 14px; color: #4338CA;">
                🔒 <strong>Privacy First:</strong> Your data is never shared with third parties. 
                <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/privacy" style="color: #4338CA;">Read our Privacy Policy</a>
              </p>
            </div>
            
            <!-- Footer -->
            <p style="font-size: 14px; color: #6B7280; margin-top: 30px; text-align: center;">
              Questions? Just reply to this email - we're here to help! 💜
            </p>
          </div>
        </div>
      `,
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