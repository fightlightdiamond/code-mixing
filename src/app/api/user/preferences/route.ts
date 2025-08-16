import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getUserFromRequest } from "@/core/auth/getUser";
import type { RequiredRule } from "@/types/api";
import logger from "@/lib/logger";

// PUT /api/user/preferences - Update current user's preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules: RequiredRule[] = [{ action: "update", subject: "User" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: { preferences: body },
      select: { preferences: true },
    });

    return NextResponse.json(updated.preferences);
  } catch (err) {
    logger.error("Error updating user preferences", undefined, err);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

