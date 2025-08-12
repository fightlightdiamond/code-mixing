import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import jwt from "jsonwebtoken";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import type { JWTPayload } from "@/types/api";

async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as JWTPayload;
    return { sub: decoded.userId, tenantId: decoded.tenantId, roles: [decoded.role] };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = [{ action: "read", subject: "Role" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const slug = searchParams.get("slug") || undefined;
  const tenantScope = searchParams.get("tenantScope") || undefined;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (slug) where.slug = { contains: slug, mode: "insensitive" };
  if (tenantScope) where.tenantScope = { equals: tenantScope };

  const items = await prisma.role.findMany({
    where,
    orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return NextResponse.json({ data: items, success: true, meta: { total: items.length } });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = [{ action: "create", subject: "Role" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, slug, tenantScope = null, isSystem = false, tenantId = null } = body || {};
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }

  const created = await prisma.role.create({
    data: {
      name: String(name),
      slug: String(slug),
      tenantScope: tenantScope ? String(tenantScope) : null,
      isSystem: Boolean(isSystem),
      tenantId: tenantId ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
