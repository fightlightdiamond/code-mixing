import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { StoryType, DifficultyLevel, ContentStatus } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

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

    const body = await request.json();
    const ids: string[] = body?.ids ?? [];
    const data = body?.data ?? {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids is required" }, { status: 400 });
    }

    // Validate enums
    if (data.storyType && !Object.values(StoryType).includes(data.storyType)) {
      return NextResponse.json(
        { error: `Invalid storyType: ${data.storyType}` },
        { status: 400 }
      );
    }
    if (data.difficulty && !Object.values(DifficultyLevel).includes(data.difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty: ${data.difficulty}` },
        { status: 400 }
      );
    }
    if (data.status && !Object.values(ContentStatus).includes(data.status)) {
      return NextResponse.json(
        { error: `Invalid status: ${data.status}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    // Validate non-empty strings for text fields
    if (
      updateData.title !== undefined &&
      typeof updateData.title === 'string' &&
      updateData.title.trim() === ''
    ) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }
    if (
      updateData.content !== undefined &&
      typeof updateData.content === 'string' &&
      updateData.content.trim() === ''
    ) {
      return NextResponse.json({ error: "content cannot be empty" }, { status: 400 });
    }

    if (data.storyType !== undefined) updateData.storyType = data.storyType;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
    if (data.chemRatio !== undefined) updateData.chemRatio = data.chemRatio;
    if (data.lessonId !== undefined) updateData.lessonId = data.lessonId;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    const result = await prisma.story.updateMany({
      where: { id: { in: ids }, tenantId: user.tenantId ?? undefined },
      data: updateData,
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

    const body = await request.json();
    const ids: string[] = body?.ids ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids is required" }, { status: 400 });
    }

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

