import { NextResponse } from 'next/server';
import { getCSRFTokenForClient } from '@/lib/csrf';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const { token, hash } = getCSRFTokenForClient();
    
    const response = NextResponse.json({ 
      csrfToken: token,
      message: 'CSRF token generated successfully' 
    });

    // Store CSRF token hash in httpOnly cookie for verification
    response.cookies.set('csrf-token', hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('CSRF token generation error', undefined, error as Error);
    return NextResponse.json(
      { message: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
