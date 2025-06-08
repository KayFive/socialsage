import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'socialsage_verify_token_123';
  
  // Get verification parameters
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify token
  if (mode === 'subscribe' && token === verifyToken) {
    // Return the challenge
    return new Response(challenge, { status: 200 });
  } else {
    // Return error
    return new Response('Verification failed', { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  // Handle webhook events (you'll implement this later)
  return new Response('Event received', { status: 200 });
}