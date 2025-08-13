import { NextRequest, NextResponse } from 'next/server';
import { sendMasteryEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, userName, userData, userId } = await request.json();

    if (!userEmail || !userName || !userData || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendMasteryEmail(userEmail, userName, userData, userId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send mastery email' },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Mastery Email API Error:', errorMessage);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}