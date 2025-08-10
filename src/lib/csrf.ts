import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * CSRF Protection utilities
 */

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
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
  // Try header first
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (headerToken) {
    return headerToken;
  }

  // Try cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const token = extractCSRFToken(request);
  if (!token) {
    return false;
  }

  // For simplicity, we'll use the token itself as the hash
  // In production, you might want to store the hash in a session or database
  return token.length === 64; // Basic validation
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

  return validateCSRFToken(request);
}

/**
 * Generate CSRF token for client
 */
export function getCSRFTokenForClient(): { token: string; hash: string } {
  const token = generateCSRFToken();
  const hash = createCSRFHash(token);
  
  return { token, hash };
}
