import jwt from "jsonwebtoken";
import type { JWTPayload } from "@/types/api";

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

export async function getUserFromRequest(request: Request): Promise<UserContext | null> {
  try {
    // Try Authorization header first, then cookie fallback
    let token = getBearerToken(request.headers.get("authorization"));
    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.split(/;\s*/).find((c) => c.startsWith("auth_token="));
        if (match) token = decodeURIComponent(match.split("=")[1] || "");
      }
    }
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("getUserFromRequest: JWT_SECRET is not set; failing closed.");
      }
      return null;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    return { sub: decoded.userId, tenantId: decoded.tenantId, roles: [decoded.role] };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("getUserFromRequest: token verification failed:", err);
    }
    return null;
  }
}
