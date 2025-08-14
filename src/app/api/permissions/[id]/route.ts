import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";

// getUserFromRequest imported from core auth

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "read", subject: "Permission" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id;
  const item = await prisma.permission.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "Permission" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id;
  const body = await _request.json();
  const { name, slug, resource, action, description, isSystem } = body || {};

  const updated = await prisma.permission.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(slug !== undefined ? { slug: String(slug) } : {}),
      ...(resource !== undefined ? { resource: String(resource) } : {}),
      ...(action !== undefined ? { action: String(action) } : {}),
      ...(description !== undefined ? { description: description ?? null } : {}),
      ...(isSystem !== undefined ? { isSystem: Boolean(isSystem) } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "delete", subject: "Permission" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id;
  await prisma.permission.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
