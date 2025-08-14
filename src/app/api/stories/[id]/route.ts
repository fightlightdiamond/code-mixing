import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import {
  Prisma,
  StoryType,
  DifficultyLevel,
  ContentStatus,
} from "@prisma/client";
import { VALID_STORY_TYPES, isValidStoryType } from "@/config";
import { getUserFromRequest } from "@/lib/auth";

function mapStory(story: any) {
  return {
    ...story,
    tags: story.tags?.map((st: any) => ({ id: st.tag.id, name: st.tag.name })) ?? [],
  };
}

// GET /api/stories/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = [{ action: "read", subject: "Story" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) {
      return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });
    }

    const story = await prisma.story.findUnique({
      where: { id: params.id, tenantId: user.tenantId ?? undefined },
      include: {
        lesson: { select: { id: true, title: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        chunks: {
          select: { id: true, chunkOrder: true, chunkText: true, type: true },
          orderBy: { chunkOrder: "asc" },
        },
        versions: {
          select: {
            id: true,
            version: true,
            content: true,
            isApproved: true,
            isPublished: true,
            chemingRatio: true,
            createdAt: true,
            creator: { select: { id: true, name: true } },
          },
          orderBy: { version: "desc" },
        },
        audios: {
          select: {
            id: true,
            storageKey: true,
            voiceType: true,
            status: true,
            durationSec: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            versions: true,
            chunks: true,
            audios: true,
            learningSessions: true,
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json(mapStory(story));
  } catch (err) {
    console.error("Error fetching story:", err);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

// PUT /api/stories/[id] - Update story
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const {
      title,
      content,
      storyType,
      chemRatio,
      lessonId,
      difficulty,
      estimatedMinutes,
      status,
      tagIds,
    } = body ?? {};

    const existingStory = await prisma.story.findUnique({
      where: { id: params.id, tenantId: user.tenantId ?? undefined },
    });
    if (!existingStory) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (storyType && !isValidStoryType(storyType)) {
      return NextResponse.json(
        {
          error: `Invalid storyType. Must be one of: ${VALID_STORY_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    if (difficulty && !Object.values(DifficultyLevel).includes(difficulty)) {
      return NextResponse.json(
        { error: `Invalid difficulty: ${difficulty}` },
        { status: 400 }
      );
    }
    if (status && !Object.values(ContentStatus).includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { tenantId: true },
      });
      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
      if (lesson.tenantId !== user.tenantId) {
        return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
      }
    }

    const updateData: Prisma.StoryUpdateInput = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (storyType !== undefined) updateData.storyType = storyType as StoryType;
    if (chemRatio !== undefined) updateData.chemRatio = chemRatio;
    if (lessonId !== undefined) updateData.lesson = { connect: { id: lessonId } };
    if (difficulty !== undefined) updateData.difficulty = difficulty as DifficultyLevel;
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
    if (status !== undefined) updateData.status = status as ContentStatus;
    if (Array.isArray(tagIds)) {
      // Validate all tagIds exist and belong to tenant
      const existingTags = await prisma.tag.findMany({
        where: { 
          id: { in: tagIds },
          tenantId: user.tenantId ?? undefined 
        },
        select: { id: true },
      });
      
      if (existingTags.length !== tagIds.length) {
        const existingIds = existingTags.map(t => t.id);
        const invalidIds = tagIds.filter((id: string) => !existingIds.includes(id));
        return NextResponse.json(
          { error: `Invalid tag IDs: ${invalidIds.join(", ")}` },
          { status: 400 }
        );
      }

      updateData.tags = {
        deleteMany: {},
        create: tagIds.map((id: string) => ({ tag: { connect: { id } } })),
      };
    }

    const story = await prisma.story.update({
      where: { id: params.id },
      data: updateData,
      include: {
        lesson: { select: { id: true, title: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        chunks: {
          select: { id: true, chunkOrder: true, chunkText: true, type: true },
          orderBy: { chunkOrder: "asc" },
        },
        versions: {
          select: {
            id: true,
            version: true,
            content: true,
            isApproved: true,
            isPublished: true,
            chemingRatio: true,
            createdAt: true,
            creator: { select: { id: true, name: true } },
          },
          orderBy: { version: "desc" },
        },
        audios: {
          select: {
            id: true,
            storageKey: true,
            voiceType: true,
            status: true,
            durationSec: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            versions: true,
            chunks: true,
            audios: true,
            learningSessions: true,
          },
        },
      },
    });

    return NextResponse.json(mapStory(story));
  } catch (err) {
    console.error("Error updating story:", err);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.story.findUnique({
      where: { id: params.id, tenantId: user.tenantId ?? undefined },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    await prisma.story.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Story deleted successfully" });
  } catch (err) {
    console.error("Error deleting story:", err);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}

