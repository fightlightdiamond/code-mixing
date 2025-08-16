import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";
import type { RequiredRule } from "@/types/api";
import { ProgressStatus } from "@prisma/client";
import logger from "@/lib/logger";

// GET /api/progress/[id] - fetch specific progress record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "read", subject: "UserProgress" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    const progress = await prisma.userProgress.findFirst({
      where: {
        id: params.id,
        userId: user.sub,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
    });

    if (!progress) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (err) {
    logger.error("Error fetching progress", undefined, err as Error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

// PUT /api/progress/[id] - update progress status or lastViewedAt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "update", subject: "UserProgress" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { status, lastViewedAt } = body ?? {};

    const allowedStatuses = Object.values(ProgressStatus) as string[];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const existing = await prisma.userProgress.findFirst({
      where: {
        id: params.id,
        userId: user.sub,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const progress = await prisma.userProgress.update({
      where: { id: params.id },
      data: {
        ...(status ? { status: status as ProgressStatus } : {}),
        ...(lastViewedAt ? { lastViewedAt: new Date(lastViewedAt) } : {}),
      },
    });

    return NextResponse.json(progress);
  } catch (err) {
    logger.error("Error updating progress", undefined, err as Error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}

// DELETE /api/progress/[id] - remove a progress record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "delete", subject: "UserProgress" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    const existing = await prisma.userProgress.findFirst({
      where: {
        id: params.id,
        userId: user.sub,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.userProgress.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Error deleting progress", undefined, err as Error);
    return NextResponse.json({ error: "Failed to delete progress" }, { status: 500 });
  }
}
