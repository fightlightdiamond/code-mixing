import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "read", subject: "User" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const userId = context.params.id;
  const ups = await prisma.userPermission.findMany({ where: { userId }, include: { permission: true } });
  return NextResponse.json({ data: ups.map((up) => ({ ...up.permission, granted: up.granted, tenantId: up.tenantId })) });
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "User" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const userId = context.params.id;
  const body = await request.json();
  const { permissionId, tenantId = null, granted = true } = body || {};
  if (!permissionId) return NextResponse.json({ error: "permissionId is required" }, { status: 400 });

  const perm = await prisma.permission.findUnique({ where: { id: permissionId } });
  if (!perm) return NextResponse.json({ error: "Permission not found" }, { status: 404 });
  const userExist = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExist) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const up = await prisma.userPermission.upsert({
    where: { userId_permissionId_tenantId: { userId, permissionId, tenantId } },
    create: { userId, permissionId, tenantId, granted: Boolean(granted) },
    update: { granted: Boolean(granted) },
  });

  return NextResponse.json(up, { status: 201 });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "User" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const userId = context.params.id;
  const { searchParams } = new URL(request.url);
  const permissionId = searchParams.get("permissionId");
  const tenantId = searchParams.get("tenantId");
  if (!permissionId) return NextResponse.json({ error: "permissionId is required" }, { status: 400 });

  const up = await prisma.userPermission.findUnique({ where: { userId_permissionId_tenantId: { userId, permissionId, tenantId } } });
  if (!up) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.userPermission.delete({ where: { userId_permissionId_tenantId: { userId, permissionId, tenantId } } });
  return NextResponse.json({ success: true });
}
