import { logger } from '@/lib/logger';
import { buildAbility } from "./ability";
import { AuthLogger } from "./auth.logger";
import { subject as caslSubject } from "@casl/ability";
import { PrismaQuery } from "@casl/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../prisma";

export interface RequiredRule {
  action: string;
  subject: string;
  conditions?: PrismaQuery;
  reason?: string;
}

type UserCtx = { sub: string; tenantId?: string; roles: string[] };

type PrismaWithPolicy = PrismaClient & { resourcePolicy?: Prisma.ResourcePolicyDelegate };

export function checkAbilities(
  rules: RequiredRule[],
  user: UserCtx
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
          ? ability.can(rule.action, caslSubject(rule.subject as string, rule.conditions as Record<string, unknown>))
          : ability.can(rule.action, rule.subject);

        if (!canAccess) {
          failedRules.push(rule);
        }
      } catch (ruleError) {
        logger.error(`Error checking rule ${rule.action}:${rule.subject}`, undefined, ruleError as Error);
        failedRules.push(rule);
      }
    }

    return {
      allowed: failedRules.length === 0,
      failedRules
    };
  } catch (error) {
    logger.error('Error in checkAbilities:', undefined, error as Error);
    return {
      allowed: false,
      failedRules: rules
    };
  }
}

// Async guard that combines RBAC (CASL) with ABAC deny-first evaluation from ResourcePolicy
export async function caslGuardWithPolicies(
  rules: RequiredRule[],
  user: UserCtx
): Promise<{ allowed: boolean; error?: string; failedRules?: RequiredRule[] }> {
  // Run RBAC first using existing guard (keeps logging behavior consistent)
  const rbac = caslGuard(rules, user);
  if (!rbac.allowed) return rbac;

  try {
    const ctx = { userId: user.sub, tenantId: user.tenantId } as const;

    const interpolate = (obj: unknown): unknown => {
      if (obj == null) return obj as unknown;
      const json = JSON.stringify(obj)
        .replace(/\$\{ctx\.userId\}/g, ctx.userId || "")
        .replace(/\$\{ctx\.tenantId\}/g, ctx.tenantId || "")
        .replace(/\$\{publicTenantId\}/g, "public");
      return JSON.parse(json);
    };

    const isContextOnly = (conditions: unknown): boolean => {
      if (!conditions || typeof conditions !== "object") return false;
      const record = conditions as Record<string, unknown>;
      const keys = Object.keys(record);
      return keys.every((k) => {
        const v = record[k];
        if (k === "tenantId") {
          if (typeof v === "string") return !!ctx.tenantId && v === ctx.tenantId;
          if (v && typeof v === "object") {
            const arr = (v as { in?: unknown[] }).in;
            if (Array.isArray(arr)) return !!ctx.tenantId && arr.includes(ctx.tenantId);
          }
          return false;
        }
        if (k === "userId") {
          if (typeof v === "string") return v === ctx.userId;
          if (v && typeof v === "object") {
            const arr = (v as { in?: unknown[] }).in;
            if (Array.isArray(arr)) return arr.includes(ctx.userId);
          }
          return false;
        }
        return false;
      });
    };

    const subjects = Array.from(new Set(rules.map((r) => r.subject)));
    for (const subject of subjects) {
      const repo = (prisma as PrismaWithPolicy).resourcePolicy;
      if (!repo) {
        // Client not generated for ResourcePolicy yet; skip ABAC and allow RBAC result
        break;
      }
      const policies = await repo.findMany({
        where: {
          isActive: true,
          resource: String(subject),
          OR: [{ tenantId: null }, { tenantId: user.tenantId ?? undefined }],
        },
        orderBy: { priority: "desc" },
        take: 50,
      });

      for (const p of policies) {
        const interpolated = interpolate(p.conditions);
        if (p.effect === "deny" && isContextOnly(interpolated)) {
          // Deny takes precedence
          return {
            allowed: false,
            error: "Access denied by policy",
            failedRules: rules,
          };
        }
      }
    }

    return { allowed: true };
  } catch (policyErr) {
    if (process.env.NODE_ENV === "development") {
      logger.warn(
        "ABAC policy evaluation failed, continuing with RBAC only",
        { error: String(policyErr) }
      );
    }
    return { allowed: true };
  }
}

// Enhanced guard function for Next.js API routes (RBAC only to retain backward compatibility)
export function caslGuard(
  rules: RequiredRule[],
  user: UserCtx
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

    // RBAC only in this function; ABAC is handled in caslGuardWithPolicies

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

    return allowed
      ? { allowed: true }
      : { allowed: false, error: "Insufficient permissions", failedRules };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Authorization check failed", { errorMessage });
    
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
