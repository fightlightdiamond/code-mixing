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

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "read", subject: "Role" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const roleId = context.params.id;
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

  const rps = await prisma.rolePermission.findMany({ where: { roleId }, include: { permission: true } });
  return NextResponse.json({ data: rps.map((rp) => rp.permission) });
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "Role" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const roleId = context.params.id;
  const body = await request.json();
  const { permissionId, tenantId = null } = body || {};
  if (!permissionId) return NextResponse.json({ error: "permissionId is required" }, { status: 400 });

  // Ensure exist
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  const perm = await prisma.permission.findUnique({ where: { id: permissionId } });
  if (!perm) return NextResponse.json({ error: "Permission not found" }, { status: 404 });

  const rp = await prisma.rolePermission.upsert({
    where: { roleId_permissionId_tenantId: { roleId, permissionId, tenantId } },
    create: { roleId, permissionId, tenantId },
    update: {},
  });

  return NextResponse.json(rp, { status: 201 });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "Role" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const roleId = context.params.id;
  const { searchParams } = new URL(request.url);
  const permissionId = searchParams.get("permissionId");
  const tenantId = searchParams.get("tenantId");
  if (!permissionId) return NextResponse.json({ error: "permissionId is required" }, { status: 400 });

  const rp = await prisma.rolePermission.findUnique({
    where: { roleId_permissionId_tenantId: { roleId, permissionId, tenantId } },
  });
  if (!rp) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.rolePermission.delete({ where: { roleId_permissionId_tenantId: { roleId, permissionId, tenantId } } });
  return NextResponse.json({ success: true });
}
