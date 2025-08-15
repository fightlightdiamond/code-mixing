import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";

// GET /api/tags - List tags for current tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = [{ action: "read", subject: "Tag" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) {
      return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });
    }

    const tags = await prisma.tag.findMany({
      where: user.tenantId ? { tenantId: user.tenantId } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    });

    return NextResponse.json(tags);
  } catch (err) {
    logger.error("Error fetching tags", undefined, err);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

