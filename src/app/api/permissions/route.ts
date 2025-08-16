import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";

// getUserFromRequest imported from core auth

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = [{ action: "read", subject: "Permission" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const resource = searchParams.get("resource") || undefined;
  const action = searchParams.get("action") || undefined;

  const where: Prisma.PermissionWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { resource: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
    ];
  }
  if (resource) where.resource = { contains: resource, mode: "insensitive" };
  if (action) where.action = { contains: action, mode: "insensitive" };

  const items = await prisma.permission.findMany({
    where,
    orderBy: [{ resource: "asc" }, { action: "asc" }],
    take: 500,
  });

  return NextResponse.json({ data: items, success: true, meta: { total: items.length } });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = [{ action: "create", subject: "Permission" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, slug, resource, action, description, isSystem = false } = body || {};
  if (!name || !slug || !resource || !action) {
    return NextResponse.json({ error: "name, slug, resource, action are required" }, { status: 400 });
  }

  const created = await prisma.permission.create({
    data: {
      name: String(name),
      slug: String(slug),
      resource: String(resource),
      action: String(action),
      description: description ?? null,
      isSystem: Boolean(isSystem),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
