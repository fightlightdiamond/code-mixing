import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { StoryType, DifficultyLevel, ContentStatus } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  data: z
    .object({
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      storyType: z.nativeEnum(StoryType).optional(),
      difficulty: z.nativeEnum(DifficultyLevel).optional(),
      estimatedMinutes: z.number().int().positive().optional(),
      chemRatio: z.number().min(0).optional(),
      lessonId: z.number().int().positive().optional(),
      status: z.nativeEnum(ContentStatus).optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: "No fields to update",
    }),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// PUT /api/stories/bulk - bulk update stories
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = [{ action: "update", subject: "Story" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) {
      return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const validationResult = bulkUpdateSchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { ids, data } = validationResult.data;

    const result = await prisma.story.updateMany({
      where: { id: { in: ids }, tenantId: user.tenantId ?? undefined },
      data,
    });

    return NextResponse.json({ count: result.count });
  } catch (err) {
    console.error("Error bulk updating stories:", err);
    return NextResponse.json(
      { error: "Failed to bulk update stories" },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/bulk - bulk delete stories
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = [{ action: "delete", subject: "Story" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) {
      return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });
    }

    const json = await request.json();
    const validationResult = bulkDeleteSchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { ids } = validationResult.data;

    const MAX_BULK_DELETE = 100;
    if (ids.length > MAX_BULK_DELETE) {
      return NextResponse.json(
        { error: `Cannot delete more than ${MAX_BULK_DELETE} stories at once` },
        { status: 400 }
      );
    }

    const result = await prisma.story.deleteMany({
      where: { id: { in: ids }, tenantId: user.tenantId ?? undefined },
    });

    return NextResponse.json({ count: result.count });
  } catch (err) {
    console.error("Error bulk deleting stories:", err);
    return NextResponse.json(
      { error: "Failed to bulk delete stories" },
      { status: 500 }
    );
  }
}

