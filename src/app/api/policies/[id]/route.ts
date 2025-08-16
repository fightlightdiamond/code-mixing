import { NextRequest, NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/core/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";
import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaWithPolicy = PrismaClient & { resourcePolicy?: Prisma.ResourcePolicyDelegate };

type PrismaWithPolicy = PrismaClient & {
  resourcePolicy?: Prisma.ResourcePolicyDelegate;
};

// getUserFromRequest imported from core auth

type PrismaWithPolicy = PrismaClient & { resourcePolicy?: Prisma.ResourcePolicyDelegate };

export async function PUT(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = [{ action: "update", subject: "ResourcePolicy" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = context.params.id; // UUID string
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await _request.json();
  const repo = (prisma as PrismaWithPolicy).resourcePolicy;
  if (!repo) return NextResponse.json({ error: "Policy model not available" }, { status: 500 });

  const updated = await repo.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const user = await getUserFromRequest(_request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = [{ action: "delete", subject: "ResourcePolicy" }];
  const auth = await caslGuardWithPolicies(rules, user);
  if (!auth.allowed) return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const repo = (prisma as PrismaWithPolicy).resourcePolicy;
  if (!repo) return NextResponse.json({ error: "Policy model not available" }, { status: 500 });

  await repo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
