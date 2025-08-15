import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

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

export async function middleware(request: NextRequest) {
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
    let token =
      request.cookies.get("auth_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    const attemptRefresh = async () => {
      const refreshToken = request.cookies.get("refresh_token")?.value;
      if (!refreshToken) return null;
      const refreshRes = await fetch(new URL("/api/auth/refresh", request.url), {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") || "" },
      });
      if (!refreshRes.ok) return null;
      const data = (await refreshRes.json().catch(() => null)) as
        | { accessToken?: string }
        | null;
      const newToken = data?.accessToken;
      const response = NextResponse.next();
      const setCookie = refreshRes.headers.get("set-cookie");
      if (setCookie) response.headers.set("set-cookie", setCookie);
      return newToken ? { token: newToken, response } : null;
    };

    let response: NextResponse | null = null;

    if (!token) {
      const refreshed = await attemptRefresh();
      if (!refreshed) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      token = refreshed.token;
      response = refreshed.response;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as any;
      const userRole = decoded.role;
      const tenantId = decoded.tenantId;

      const requiredRoles =
        protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
      if (!requiredRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      const res = response ?? NextResponse.next();
      res.headers.set("x-user-id", decoded.userId);
      res.headers.set("x-user-role", userRole);
      res.headers.set("x-user-email", decoded.email);
      if (tenantId) {
        res.headers.set("x-tenant-id", tenantId);
      }

      return addSecurityHeaders(res);
    } catch (error: any) {
      if (error?.name === "TokenExpiredError") {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          try {
            const decoded = jwt.verify(
              refreshed.token,
              process.env.JWT_SECRET || "fallback-secret"
            ) as any;
            const userRole = decoded.role;
            const tenantId = decoded.tenantId;
            const requiredRoles =
              protectedRoutes[protectedRoute as keyof typeof protectedRoutes];
            if (!requiredRoles.includes(userRole)) {
              return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
            const res = refreshed.response ?? NextResponse.next();
            res.headers.set("x-user-id", decoded.userId);
            res.headers.set("x-user-role", userRole);
            res.headers.set("x-user-email", decoded.email);
            if (tenantId) {
              res.headers.set("x-tenant-id", tenantId);
            }
            return addSecurityHeaders(res);
          } catch (err) {
            console.error("Token verification failed after refresh:", err);
          }
        }
      }

      console.error("Token verification failed:", error);
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
