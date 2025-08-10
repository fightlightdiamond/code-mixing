// Simple logger for authorization events
export class AuthLogger {
  static logUnauthorizedAccess(
    userId: string,
    tenantId: string,
    action: string,
    subject: string,
    details?: Record<string, any>
  ) {
    console.warn(`[AUTH] Unauthorized access attempt:`, {
      userId,
      tenantId,
      action,
      subject,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  static logForbiddenAccess(
    userId: string,
    tenantId: string,
    action: string,
    subject: string,
    reason: string,
    details?: Record<string, any>
  ) {
    console.warn(`[AUTH] Forbidden access:`, {
      userId,
      tenantId,
      action,
      subject,
      reason,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  static logAuthorizationCheck(
    userId: string,
    tenantId: string,
    action: string,
    subject: string,
    allowed: boolean,
    details?: Record<string, any>
  ) {
    console.info(`[AUTH] Authorization check:`, {
      userId,
      tenantId,
      action,
      subject,
      allowed,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
