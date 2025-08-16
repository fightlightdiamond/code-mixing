import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";
import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaWithPolicy = PrismaClient & { resourcePolicy?: Prisma.ResourcePolicyDelegate };

// getUserFromRequest imported from core auth

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = [{ action: "read", subject: "ResourcePolicy" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || undefined;
  const tenantId = searchParams.get("tenantId") || undefined;

  // optional repo access to compile even if model not generated yet
  const repo = (prisma as PrismaWithPolicy).resourcePolicy;
  if (!repo) return NextResponse.json({ data: [], success: true, meta: { total: 0 } });

  const where: any = {};
  if (resource) where.resource = resource;
  if (tenantId) where.tenantId = tenantId;

  const items = await repo.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ data: items, success: true, meta: { total: items.length } });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = [{ action: "create", subject: "ResourcePolicy" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, resource, effect, conditions, priority = 0, tenantId = null, isActive = true } = body || {};

  if (!name || !resource || !effect) {
    return NextResponse.json({ error: "name, resource and effect are required" }, { status: 400 });
  }

  const repo = (prisma as PrismaWithPolicy).resourcePolicy;
  if (!repo) return NextResponse.json({ error: "Policy model not available" }, { status: 500 });

  const created = await repo.create({
    data: {
      name: String(name),
      resource: String(resource),
      effect: effect === "deny" ? "deny" : "allow",
      conditions: conditions ?? {},
      priority: Number(priority) || 0,
      tenantId: tenantId ?? user.tenantId ?? null,
      isActive: Boolean(isActive),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
