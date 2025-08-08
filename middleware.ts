import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['student', 'coach', 'admin'],
  '/lessons': ['student', 'coach', 'admin'],
  '/progress': ['student', 'coach', 'admin'],
  '/vocabulary': ['student', 'coach', 'admin'],
  '/coach': ['coach', 'admin'],
  '/admin': ['admin'],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const protectedRoute = Object.keys(protectedRoutes).find(route => 
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      const userRole = decoded.role;

      // Check if user has required role
      const requiredRoles = protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
      if (!requiredRoles.includes(userRole)) {
        // Redirect to unauthorized page
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Add user info to headers for API routes
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded.userId.toString());
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-user-email', decoded.email);

      return response;

    } catch (error) {
      // Invalid token, redirect to login
      console.error('Token verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
