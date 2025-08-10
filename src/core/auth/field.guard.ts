import { buildAbility } from "./ability";
import { AuthLogger } from "./auth.logger";

interface FieldRule {
  action: string;
  subject: string;
  fields: string[];
  conditions?: Record<string, unknown>;
}

export function checkFieldAccess(
  rules: FieldRule[],
  user: { sub: string; tenantId?: string; roles: string[] },
  action: string,
  subject: string,
  field: string
): boolean {
  const ability = buildAbility(undefined, {
    userId: user.sub,
    tenantId: user.tenantId,
    roles: user.roles,
  });

  // Check if user can perform the action on the subject with the specific field
  return ability.can(action, subject, field);
}

// Guard function for field-level access control
export function fieldGuard(
  rules: FieldRule[],
  user: { sub: string; tenantId?: string; roles: string[] },
  action: string,
  subject: string,
  field: string
): { allowed: boolean; error?: string } {
  try {
    const isAllowed = checkFieldAccess(rules, user, action, subject, field);

    // Log the field access check
    AuthLogger.logAuthorizationCheck(
      user.sub,
      user.tenantId || "unknown",
      action,
      `${subject}.${field}`,
      isAllowed
    );

    if (!isAllowed) {
      AuthLogger.logForbiddenAccess(
        user.sub,
        user.tenantId || "unknown",
        action,
        `${subject}.${field}`,
        "Insufficient permissions for this field"
      );

      return {
        allowed: false,
        error: "Insufficient permissions for this field",
      };
    }

    return { allowed: true };
  } catch (error) {
    AuthLogger.logForbiddenAccess(
      user.sub,
      user.tenantId || "unknown",
      action,
      `${subject}.${field}`,
      "Field access check failed"
    );

    return {
      allowed: false,
      error: "Field access check failed",
    };
  }
}
