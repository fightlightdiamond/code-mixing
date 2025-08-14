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
    const token = getBearerToken(request.headers.get("authorization"));
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as JWTPayload;
    return { sub: decoded.userId, tenantId: decoded.tenantId, roles: [decoded.role] };
  } catch {
    return null;
  }
}
