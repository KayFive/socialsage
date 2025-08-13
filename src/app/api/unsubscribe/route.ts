import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'all'; // 'all', 'marketing', 'product', 'tips'

  if (!token) {
    return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 400 });
  }

  try {
    // Find user by unsubscribe token
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'Invalid unsubscribe link' }, { status: 404 });
    }

    // Update email preferences based on type
    const updates: any = {};
    
    if (type === 'all') {
      updates.email_marketing_enabled = false;
      updates.email_product_updates = false;
      updates.email_growth_tips = false;
      updates.unsubscribed_at = new Date().toISOString();
    } else if (type === 'marketing') {
      updates.email_marketing_enabled = false;
    } else if (type === 'product') {
      updates.email_product_updates = false;
    } else if (type === 'tips') {
      updates.email_growth_tips = false;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Return success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - SocialSage</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #3B82F6; margin-bottom: 10px; }
            .message { color: #374151; line-height: 1.6; margin-bottom: 25px; }
            .success { background: #F0FDF4; border: 1px solid #22C55E; padding: 15px; border-radius: 8px; color: #15803D; margin-bottom: 20px; }
            .actions { text-align: center; }
            .btn { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 5px; }
            .btn:hover { background: #2563EB; }
            .btn-secondary { background: #6B7280; }
            .btn-secondary:hover { background: #4B5563; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SocialSage</div>
              <h1>Unsubscribed Successfully</h1>
            </div>
            
            <div class="success">
              ✅ You've been unsubscribed from ${type === 'all' ? 'all emails' : `${type} emails`}.
            </div>
            
            <div class="message">
              <p>We're sorry to see you go! You can always:</p>
              <ul>
                <li>Re-enable emails in your account settings</li>
                <li>Continue using SocialSage without emails</li>
                <li>Contact support if you have feedback</li>
              </ul>
            </div>
            
            <div class="actions">
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}" class="btn">
                Return to SocialSage
              </a>
              <a href="${process.env.NEXT_PUBLIC_URL || 'https://socialsageapp.com'}/contact" class="btn btn-secondary">
                Contact Support
              </a>
            </div>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unsubscribe error:', errorMessage);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

// Handle preference updates (for granular control)
export async function POST(request: NextRequest) {
  try {
    const { token, preferences } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Find user by token
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Update preferences
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_marketing_enabled: preferences.marketing || false,
        email_product_updates: preferences.product || false,
        email_growth_tips: preferences.tips || false,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}