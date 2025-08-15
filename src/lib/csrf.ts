import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection utilities
 */

const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET) {
  throw new Error('CSRF_SECRET environment variable is required');
}
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_COOKIE = 'csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create CSRF token hash
 */
export function createCSRFHash(token: string): string {
  return crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, hash: string): boolean {
  const expectedHash = createCSRFHash(token);
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(request: NextRequest): string | null {
  return request.headers.get(CSRF_TOKEN_HEADER);
}

/**
 * Middleware to check CSRF token
 */
export function csrfMiddleware(request: NextRequest): boolean {
  // Skip CSRF for auth endpoints (they have their own protection)
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return true;
  }

  // Skip for public API endpoints
  const publicApiPaths = [
    '/api/health',
    '/api/status',
  ];

  if (publicApiPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return true;
  }

  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const token = extractCSRFToken(request);
  const hash = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  if (!token || !hash) {
    return false;
  }

  return verifyCSRFToken(token, hash);
}

/**
 * Generate CSRF token for client
 */
export function getCSRFTokenForClient(): { token: string; hash: string } {
  const token = generateCSRFToken();
  const hash = createCSRFHash(token);
  
  return { token, hash };
}
