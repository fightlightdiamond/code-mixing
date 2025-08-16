import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Verify a JWT token using the application's secret.
 * Ensures consistent error handling across the codebase.
 */
export function verifyJwt<T extends JwtPayload>(token: string): T {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as T;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

