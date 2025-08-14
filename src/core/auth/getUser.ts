import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import type { JWTPayload } from "@/types/api";

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns the user context needed for authorization checks or null if invalid.
 * Throws an error if JWT_SECRET is not configured.
 */
export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"], // keep in sync with your token issuer
      // issuer: "your-issuer",    // uncomment if you control/know the issuer
      // audience: "your-audience" // uncomment if you set audience
      ignoreExpiration: false,
    }) as JWTPayload;
    return { sub: decoded.userId, tenantId: decoded.tenantId, roles: [decoded.role] };
  } catch {
    return null;
  }
}
