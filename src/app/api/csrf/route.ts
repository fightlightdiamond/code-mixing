import { NextResponse } from 'next/server';
import { getCSRFTokenForClient } from '@/lib/csrf';

export async function GET() {
  try {
    const { token } = getCSRFTokenForClient();
    
    const response = NextResponse.json({ 
      csrfToken: token,
      message: 'CSRF token generated successfully' 
    });

    // Set CSRF token in httpOnly cookie for additional security
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json(
      { message: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
