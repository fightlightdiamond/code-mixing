import { AbilityBuilder, RawRuleOf } from '@casl/ability';
import { createPrismaAbility, PrismaAbility, PrismaQuery } from '@casl/prisma';

// Define the types for our application
export type Actions =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "approve"
  | "assign"
  | "grade"
  | "remix"
  | "export";
export type Subjects =
  | "Tenant"
  | "User"
  | "Role"
  | "Course"
  | "Unit"
  | "Lesson"
  | "Story"
  | "StoryVersion"
  | "ClozeConfig"
  | "AudioAsset"
  | "Exercise"
  | "Question"
  | "Choice"
  | "Quiz"
  | "QuizResult"
  | "Tag"
  | "RemixJob"
  | "UserProgress"
  | "Approval"
  | "all";

export type AppAbility = PrismaAbility<[Actions, Subjects]>;

// Define proper types for rule conditions using CASL PrismaQuery
export type RuleConditions = PrismaQuery;

// Define proper rule interface
export interface AbilityRule {
  action: Actions | Actions[];
  subject: Subjects | Subjects[];
  conditions?: RuleConditions;
  inverted?: boolean;
  reason?: string;
}

// Role definitions from requirements
const roleDefinitions: Record<string, AbilityRule[]> = {
  super_admin: [{ action: "manage", subject: "all" }],
  admin: [{ action: "manage", subject: "all" }], // Add admin role with full permissions
  org_admin: [
    {
      action: "manage",
      subject: "User",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "Role",
      conditions: { tenantScope: "tenant" },
    },
    {
      action: "manage",
      subject: "Course",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "Unit",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "Lesson",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "Story",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "StoryVersion",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "Exercise",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "AudioAsset",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: "Quiz",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "read",
      subject: "QuizResult",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "approve",
      subject: ["StoryVersion", "Lesson"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "publish",
      subject: ["StoryVersion", "Lesson"],
      conditions: { tenantId: "${ctx.tenantId}", isApproved: true },
    },
  ],
  curriculum_lead: [
    {
      action: ["create", "read", "update"],
      subject: [
        "Course",
        "Unit",
        "Lesson",
        "Story",
        "StoryVersion",
        "Exercise",
      ],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "approve",
      subject: ["StoryVersion", "Lesson"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "publish",
      subject: ["StoryVersion", "Lesson"],
      conditions: { tenantId: "${ctx.tenantId}", isApproved: true },
    },
    {
      action: "delete",
      subject: ["Story", "Exercise"],
      conditions: { tenantId: "${ctx.tenantId}", status: { in: ["draft"] } },
    },
    {
      action: "assign",
      subject: "Lesson",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
  ],
  content_creator: [
    {
      action: ["create", "read", "update"],
      subject: ["Story", "StoryVersion", "ClozeConfig", "Exercise", "Question"],
      conditions: { tenantId: "${ctx.tenantId}", ownerId: "${ctx.userId}" },
    },
    {
      action: "read",
      subject: ["Course", "Unit", "Lesson"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "remix",
      subject: "StoryVersion",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "delete",
      subject: ["StoryVersion", "Exercise"],
      conditions: {
        tenantId: "${ctx.tenantId}",
        ownerId: "${ctx.userId}",
        status: "draft",
      },
    },
  ],
  instructor: [
    {
      action: "read",
      subject: [
        "Course",
        "Unit",
        "Lesson",
        "Story",
        "StoryVersion",
        "Exercise",
        "AudioAsset",
        "Quiz",
      ],
      conditions: {
        tenantId: "${ctx.tenantId}",
        status: { in: ["published", "ready"] },
      },
    },
    {
      action: "assign",
      subject: "Lesson",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "grade",
      subject: "QuizResult",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "export",
      subject: "QuizResult",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
  ],
  // Coach role: similar to instructor, focused on mentoring and grading
  coach: [
    {
      action: "read",
      subject: [
        "Course",
        "Unit",
        "Lesson",
        "Story",
        "StoryVersion",
        "Exercise",
        "AudioAsset",
        "Quiz",
      ],
      conditions: {
        tenantId: "${ctx.tenantId}",
        status: { in: ["published", "ready"] },
      },
    },
    {
      action: "assign",
      subject: "Lesson",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "grade",
      subject: "QuizResult",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "export",
      subject: "QuizResult",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
  ],
  voice_artist: [
    {
      action: ["create", "read", "update"],
      subject: "AudioAsset",
      conditions: { tenantId: "${ctx.tenantId}", ownerId: "${ctx.userId}" },
    },
    {
      action: "read",
      subject: ["Lesson", "Story"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
  ],
  qa: [
    {
      action: "read",
      subject: ["Lesson", "StoryVersion", "Exercise", "AudioAsset"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "update",
      subject: ["StoryVersion", "Exercise", "AudioAsset"],
      conditions: { tenantId: "${ctx.tenantId}", status: "in_review" },
    },
  ],
  student: [
    {
      action: "read",
      subject: [
        "Course",
        "Unit",
        "Lesson",
        "Story",
        "StoryVersion",
        "Exercise",
        "AudioAsset",
        "Quiz",
      ],
      conditions: { tenantId: "${ctx.tenantId}", status: "published" },
    },
    {
      action: ["create", "read", "update"],
      subject: "UserProgress",
      conditions: { tenantId: "${ctx.tenantId}", userId: "${ctx.userId}" },
    },
    {
      action: ["create", "read"],
      subject: "QuizResult",
      conditions: { tenantId: "${ctx.tenantId}", userId: "${ctx.userId}" },
    },
    {
      action: "remix",
      subject: "StoryVersion",
      conditions: { tenantId: "${ctx.tenantId}", isPublished: true },
    },
  ],
  guest: [
    {
      action: "read",
      subject: "Lesson",
      conditions: { status: "published", tenantId: "${publicTenantId}" },
    },
  ],
};

// Cache for built abilities to avoid rebuilding for same context
const abilityCache = new Map<string, { ability: AppAbility; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to create cache key
function createCacheKey(ctx: { userId?: string; roles?: string[]; tenantId?: string } | undefined): string {
  if (!ctx) return 'no-ctx';
  return `${ctx.userId || 'no-user'}-${ctx.tenantId || 'no-tenant'}-${(ctx.roles || []).sort().join(',')}`;
}

// Helper to clean expired cache entries
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of abilityCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      abilityCache.delete(key);
    }
  }
}

// Define proper context interface
export interface AbilityContext {
  userId?: string;
  roles?: string[];
  tenantId?: string;
}

// Define proper server rules interface
export type ServerRule = RawRuleOf<AppAbility>;

export function buildAbility(
  rulesFromServer: RawRuleOf<AppAbility>[] | undefined,
  ctx: AbilityContext | undefined
): AppAbility {
  // If rulesFromServer is provided, use them directly
  if (rulesFromServer) {
    return createPrismaAbility(rulesFromServer);
  }

  // Check cache first
  const cacheKey = createCacheKey(ctx);
  const cached = abilityCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.ability;
  }

  // Clean expired entries periodically
  if (abilityCache.size > 100) {
    cleanExpiredCache();
  }

  // Fallback to role-based rules using AbilityBuilder
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  // Default deny all if no tenant (except SuperAdmin)
  const isSuper = ctx?.roles?.includes("super_admin");
  if (!ctx?.tenantId && !isSuper) {
    cannot("read", "all");
    return build();
  }

  // Apply role definitions
  if (ctx?.roles) {
    ctx.roles.forEach((role) => {
      const rules = roleDefinitions[role];
      if (rules) {
        rules.forEach((rule) => {
          // Replace placeholders with actual context values
          let conditions = rule.conditions;
          if (conditions) {
            conditions = JSON.parse(
              JSON.stringify(conditions)
                .replace(/\$\{ctx\.userId\}/g, ctx.userId || "")
                .replace(/\$\{ctx\.tenantId\}/g, ctx.tenantId || "")
                .replace(/\$\{publicTenantId\}/g, "public")
            );
          }

          // Handle array of subjects
          const subjects = Array.isArray(rule.subject)
            ? rule.subject
            : [rule.subject];

          subjects.forEach((subject) => {
            if (Array.isArray(rule.action)) {
              can(rule.action, subject, conditions);
            } else {
              can(rule.action, subject, conditions);
            }
          });
        });
      }
    });
  }

  const ability = build();
  
  // Cache the built ability
  abilityCache.set(cacheKey, {
    ability,
    timestamp: now
  });
  
  return ability;
}
