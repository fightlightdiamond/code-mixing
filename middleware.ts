import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/core/auth/jwt";
import type { JWTPayload } from "@/types/api";
import jwt from "jsonwebtoken";
import logger from "@/lib/logger";

interface JwtPayload {
  userId: string;
  role: string;
  email: string;
  tenantId?: string;
}

// Security headers
const securityHeaders = {
  // Prevent XSS attacks
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",

  // HTTPS enforcement
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for Next.js
    "style-src 'self' 'unsafe-inline'", // Allow inline styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; "),

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Define protected routes and their required roles
const protectedRoutes = {
  "/dashboard": ["student", "coach", "admin"],
  "/lessons": ["student", "coach", "admin"],
  "/progress": ["student", "coach", "admin"],
  "/vocabulary": ["student", "coach", "admin"],
  "/coach": ["coach", "admin"],
  "/admin": ["admin"],
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
];

// Helper function to add security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Check if the route is protected
  const protectedRoute = Object.keys(protectedRoutes).find((route) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    // Get token from cookies or Authorization header
    const token =
      request.cookies.get("auth_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Verify token
      const decoded = verifyJwt<JWTPayload>(token);
      const userRole = decoded.role;
      const tenantId = decoded.tenantId;

      // Check if user has required role
      const requiredRoles =
        protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
      if (!requiredRoles.includes(userRole)) {
        // Redirect to unauthorized page
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      // Add user info to headers for API routes
      const response = NextResponse.next();
      response.headers.set("x-user-id", decoded.userId);
      response.headers.set("x-user-role", userRole);
      response.headers.set("x-user-email", decoded.email);
      if (tenantId) {
        response.headers.set("x-tenant-id", tenantId);
      }

      return addSecurityHeaders(response);
    } catch (error) {
      // Invalid token, redirect to login
      logger.error("Token verification failed:", undefined, error);

      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
