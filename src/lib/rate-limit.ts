export interface RateLimitOptions {
  /** Number of milliseconds before counters reset */
  windowMs: number;
  /** Maximum number of requests within the window */
  max: number;
}

const attempts = new Map<string, { count: number; firstRequestTime: number }>();

/**
 * Simple in-memory IP based rate limiter.
 * @returns true if request is allowed, false if limit exceeded.
 */
export function rateLimit(ip: string, { windowMs, max }: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry) {
    attempts.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  // Reset window if time passed
  if (now - entry.firstRequestTime > windowMs) {
    attempts.set(ip, { count: 1, firstRequestTime: now });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count += 1;
  return true;
}
