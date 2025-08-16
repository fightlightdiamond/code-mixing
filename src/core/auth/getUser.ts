import { logger } from '@/lib/logger';
import { NextRequest } from "next/server";
import type { JWTPayload } from "@/types/api";
import { verifyJwt } from "@/core/auth/jwt";

export interface UserContext {
  sub: string;
  tenantId?: string;
  roles: string[];
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Extracts and verifies the JWT from the Authorization header or auth_token cookie.
 * Returns the user context needed for authorization checks or null if invalid.
 * Fails closed if JWT_SECRET is not configured.
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<UserContext | null> {
  try {
    // Try Authorization header first, then cookie fallback
    let token = getBearerToken(request.headers.get("authorization"));
    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader
          .split(/;\s*/)
          .find((c) => c.startsWith("auth_token="));
        if (match) token = decodeURIComponent(match.split("=")[1] || "");
      }
    }
    if (!token) return null;

    const decoded = verifyJwt<JWTPayload>(token);

    return {
      sub: decoded.userId,
      tenantId: decoded.tenantId,
      roles: [decoded.role],
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn("getUserFromRequest: token verification failed", {
        error: String(err),
      });
    }
    return null;
  }
}
