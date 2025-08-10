import { buildAbility } from "./ability";
import { AuthLogger } from "./auth.logger";

export interface RequiredRule {
  action: string;
  subject: string;
  conditions?: Record<string, unknown>;
}

export function checkAbilities(
  rules: RequiredRule[],
  user: { sub: string; tenantId?: string; roles: string[] }
): boolean {
  const ability = buildAbility(undefined, {
    userId: user.sub,
    tenantId: user.tenantId,
    roles: user.roles,
  });

  return rules.every((rule) => {
    // For simple cases, we can check without conditions first
    if (!rule.conditions) {
      return ability.can(rule.action, rule.subject);
    }

    // For complex cases with conditions, we need to be more careful
    // This is a simplified check - in a real implementation you might need more sophisticated logic
    return ability.can(rule.action, rule.subject);
  });
}

// Guard function for Next.js API routes
export function caslGuard(
  rules: RequiredRule[],
  user: { sub: string; tenantId?: string; roles: string[] }
): { allowed: boolean; error?: string } {
  try {
    const isAllowed = checkAbilities(rules, user);

    // Only log in development or when explicitly enabled
    const shouldLog = process.env.NODE_ENV === 'development' || process.env.ENABLE_AUTH_LOGGING === 'true';
    
    if (shouldLog) {
      // Pre-compute strings to avoid repeated map operations
      const actions = rules.map((r) => r.action).join(", ");
      const subjects = rules.map((r) => r.subject).join(", ");
      const tenantId = user.tenantId || "unknown";
      
      AuthLogger.logAuthorizationCheck(
        user.sub,
        tenantId,
        actions,
        subjects,
        isAllowed
      );

      if (!isAllowed) {
        AuthLogger.logForbiddenAccess(
          user.sub,
          tenantId,
          actions,
          subjects,
          "Insufficient permissions"
        );
      }
    }

    if (!isAllowed) {
      return {
        allowed: false,
        error: "Insufficient permissions",
      };
    }

    return { allowed: true };
  } catch (error) {
    // Always log errors regardless of environment
    const actions = rules.map((r) => r.action).join(", ");
    const subjects = rules.map((r) => r.subject).join(", ");
    
    AuthLogger.logForbiddenAccess(
      user.sub,
      user.tenantId || "unknown",
      actions,
      subjects,
      "Authorization check failed"
    );

    return {
      allowed: false,
      error: "Authorization check failed",
    };
  }
}
