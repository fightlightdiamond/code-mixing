import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "read", subject: "Role" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id;
  const item = await prisma.role.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "Role" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id;
  const body = await _request.json();
  const { name, slug, tenantScope, isSystem, tenantId } = body || {};

  const updated = await prisma.role.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(slug !== undefined ? { slug: String(slug) } : {}),
      ...(tenantScope !== undefined ? { tenantScope: tenantScope ? String(tenantScope) : null } : {}),
      ...(isSystem !== undefined ? { isSystem: Boolean(isSystem) } : {}),
      ...(tenantId !== undefined ? { tenantId: tenantId ?? null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "delete", subject: "Role" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id;
  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
