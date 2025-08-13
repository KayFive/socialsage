import { NextRequest, NextResponse } from 'next/server';
import { sendAdvancedFeaturesEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, userData } = await request.json();

    if (!userEmail || !userName || !userData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // You need to provide a userId as the fourth argument
    const userId = userData?.userId || ''; // Adjust this line to get the correct userId
    const result = await sendAdvancedFeaturesEmail(userEmail, userName, userData, userId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send advanced features email' },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Advanced Email API Error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}