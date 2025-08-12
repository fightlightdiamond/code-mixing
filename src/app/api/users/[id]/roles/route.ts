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
  const auth = await caslGuardWithPolicies([{ action: "read", subject: "User" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const userId = context.params.id;
  const urs = await prisma.userToRole.findMany({ where: { userId }, include: { role: true } });
  return NextResponse.json({ data: urs.map((ur) => ur.role) });
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "User" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const userId = context.params.id;
  const body = await request.json();
  const { roleId, tenantId = null } = body || {};
  if (!roleId) return NextResponse.json({ error: "roleId is required" }, { status: 400 });

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  const userExist = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExist) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ur = await prisma.userToRole.upsert({
    where: { userId_roleId_tenantId: { userId, roleId, tenantId } },
    create: { userId, roleId, tenantId },
    update: {},
  });

  return NextResponse.json(ur, { status: 201 });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const auth = await caslGuardWithPolicies([{ action: "update", subject: "User" }], user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const userId = context.params.id;
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("roleId");
  const tenantId = searchParams.get("tenantId");
  if (!roleId) return NextResponse.json({ error: "roleId is required" }, { status: 400 });

  const ur = await prisma.userToRole.findUnique({ where: { userId_roleId_tenantId: { userId, roleId, tenantId } } });
  if (!ur) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.userToRole.delete({ where: { userId_roleId_tenantId: { userId, roleId, tenantId } } });
  return NextResponse.json({ success: true });
}
