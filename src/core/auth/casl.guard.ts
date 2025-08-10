import { buildAbility } from "./ability";
import { AuthLogger } from "./auth.logger";
import { MongoQuery } from "@casl/ability";

export interface RequiredRule {
  action: string;
  subject: string;
  conditions?: MongoQuery;
  reason?: string;
}

export function checkAbilities(
  rules: RequiredRule[],
  user: { sub: string; tenantId?: string; roles: string[] }
): { allowed: boolean; failedRules: RequiredRule[] } {
  try {
    // Validate input parameters
    if (!rules || !Array.isArray(rules)) {
      throw new Error('Rules must be a non-empty array');
    }
    if (!user || !user.sub) {
      throw new Error('User must have a valid sub (ID)');
    }

    const ability = buildAbility(undefined, {
      userId: user.sub,
      tenantId: user.tenantId,
      roles: user.roles,
    });

    const failedRules: RequiredRule[] = [];
    
    for (const rule of rules) {
      try {
        // Validate rule structure
        if (!rule.action || !rule.subject) {
          throw new Error(`Invalid rule: action and subject are required`);
        }

        const canAccess = rule.conditions 
          ? ability.can(rule.action, rule.subject, rule.conditions as any)
          : ability.can(rule.action, rule.subject);

        if (!canAccess) {
          failedRules.push(rule);
        }
      } catch (ruleError) {
        console.error(`Error checking rule ${rule.action}:${rule.subject}:`, ruleError);
        failedRules.push(rule);
      }
    }

    return {
      allowed: failedRules.length === 0,
      failedRules
    };
  } catch (error) {
    console.error('Error in checkAbilities:', error);
    return {
      allowed: false,
      failedRules: rules
    };
  }
}

// Enhanced guard function for Next.js API routes
export function caslGuard(
  rules: RequiredRule[],
  user: { sub: string; tenantId?: string; roles: string[] }
): { allowed: boolean; error?: string; failedRules?: RequiredRule[] } {
  try {
    // Validate inputs
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return {
        allowed: false,
        error: "No authorization rules provided",
      };
    }

    if (!user || !user.sub) {
      return {
        allowed: false,
        error: "Invalid user context",
      };
    }

    const { allowed, failedRules } = checkAbilities(rules, user);

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
        allowed,
        {
          failedRulesCount: failedRules.length,
          userRoles: user.roles,
        }
      );

      // Log specific failures for debugging
      if (!allowed && failedRules.length > 0) {
        failedRules.forEach(rule => {
          AuthLogger.logForbiddenAccess(
            user.sub,
            tenantId,
            rule.action,
            rule.subject,
            rule.reason || "Insufficient permissions",
            {
              userRoles: user.roles,
              hasConditions: !!rule.conditions
            }
          );
        });
      }
    }

    if (!allowed) {
      return {
        allowed: false,
        error: "Insufficient permissions",
        failedRules,
      };
    }

    return { allowed: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Authorization check failed:", errorMessage);
    
    // Log the error for debugging
    if (user?.sub) {
      AuthLogger.logUnauthorizedAccess(
        user.sub,
        user.tenantId || "unknown",
        "unknown",
        "unknown",
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        }
      );
    }

    return {
      allowed: false,
      error: "Authorization check failed",
    };
  }
}
