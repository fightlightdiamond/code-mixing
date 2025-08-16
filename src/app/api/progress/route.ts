import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";
import type { RequiredRule } from "@/types/api";
import { Prisma, ProgressStatus } from "@prisma/client";
import logger from "@/lib/logger";

// GET /api/progress - list or fetch progress for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "read", subject: "UserProgress" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");
    const statusParam = searchParams.get("status");

    const where: Prisma.UserProgressWhereInput = {
      userId: user.sub,
      ...(user.tenantId ? { tenantId: user.tenantId } : {}),
    };

    if (lessonId) where.lessonId = lessonId;
    if (statusParam) where.status = statusParam as ProgressStatus;

    const progressRecords = await prisma.userProgress.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    if (lessonId) {
      return NextResponse.json(progressRecords[0] || null);
    }

    return NextResponse.json(progressRecords);
  } catch (err) {
    logger.error("Error fetching user progress", undefined, err as Error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

// POST /api/progress - create or update progress (upsert)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "create", subject: "UserProgress" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { lessonId, status = ProgressStatus.IN_PROGRESS } = body ?? {};

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    }

    if (!user.tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const allowedStatuses = Object.values(ProgressStatus) as string[];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.sub,
          lessonId,
        },
      },
      update: {
        status: status as ProgressStatus,
        lastViewedAt: new Date(),
      },
      create: {
        userId: user.sub,
        lessonId,
        tenantId: user.tenantId,
        status: status as ProgressStatus,
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json(progress, { status: 201 });
  } catch (err) {
    logger.error("Error updating user progress", undefined, err as Error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
