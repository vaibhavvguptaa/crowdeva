import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/fileSessionStore';

export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookies
    const sidCookie = request.cookies.get('sid')?.value;
    
    if (!sidCookie) {
      return NextResponse.json({ 
        hasSession: false, 
        message: 'No session ID found in cookies' 
      });
    }
    
    // Get session from store
    const session = await getSession(sidCookie);
    
    if (!session) {
      return NextResponse.json({ 
        hasSession: false, 
        sessionId: sidCookie,
        message: 'Session not found in store' 
      });
    }
    
    return NextResponse.json({ 
      hasSession: true, 
      sessionId: sidCookie,
      session: {
        authType: session.authType,
        createdAt: session.createdAt,
        lastRotatedAt: session.lastRotatedAt,
        userId: session.userId
      },
      message: 'Session found' 
    });
  } catch (error) {
    return NextResponse.json({ 
      hasSession: false,
      message: 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}