// app/api/test-email/route.ts - Super simple version
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-templates';

export async function GET() {
  try {
    // Just test with a fake but properly formatted UUID
    // The enhanced email templates will handle missing profiles gracefully
    const result = await sendWelcomeEmail(
      'krivory5@gmail.com', // Your email
      'Test User',
      '550e8400-e29b-41d4-a716-446655440000' // Valid UUID format
    );
    
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}