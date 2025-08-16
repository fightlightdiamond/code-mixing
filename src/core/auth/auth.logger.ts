import { logger } from '@/lib/logger';
// Simple logger for authorization events
export class AuthLogger {
  static logUnauthorizedAccess(
    userId: string,
    tenantId: string,
    action: string,
    subject: string,
    metadata?: Record<string, unknown>
  ) {
    logger.warn(`[AUTH] Unauthorized access attempt:`, {
      userId,
      tenantId,
      action,
      subject,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  static logForbiddenAccess(
    userId: string,
    tenantId: string,
    action: string,
    subject: string,
    reason: string,
    metadata?: Record<string, unknown>
  ) {
    logger.warn(`[AUTH] Forbidden access:`, {
      userId,
      tenantId,
      action,
      subject,
      reason,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  static logAuthorizationCheck(
    userId: string,
    tenantId: string,
    action: string,
    subject: string,
    allowed: boolean,
    metadata?: Record<string, unknown>
  ) {
    console.info(`[AUTH] Authorization check:`, {
      userId,
      tenantId,
      action,
      subject,
      allowed,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }
}
