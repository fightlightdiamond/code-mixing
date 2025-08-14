import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/lib/auth";
import {
  Prisma,
  StoryType,
  DifficultyLevel,
  ContentStatus,
} from "@prisma/client";
import { isValidStoryType, VALID_STORY_TYPES } from "@/config";

// Map StoryTag[] to Tag[] for API response
function mapStory(story: any) {
  return {
    ...story,
    tags: story.tags?.map((st: any) => ({ id: st.tag.id, name: st.tag.name })) ?? [],
  };
}

// GET /api/stories - List stories with filters
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const lessonId = searchParams.get("lessonId") || undefined;
    const storyType = searchParams.get("storyType") as StoryType | undefined;
    const difficulty = searchParams.get("difficulty") as DifficultyLevel | undefined;
    const status = searchParams.get("status") as ContentStatus | undefined;
    const createdBy = searchParams.get("createdBy") || undefined;
    const tagIds = searchParams.getAll("tagIds");

    let where: Prisma.StoryWhereInput = {
      ...(user.tenantId ? { tenantId: user.tenantId } : {}),
    };

    if (search) {
      where = {
        ...where,
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      };
    }
    if (lessonId) where = { ...where, lessonId };
    if (storyType && Object.values(StoryType).includes(storyType)) {
      where = { ...where, storyType };
    }
    if (difficulty && Object.values(DifficultyLevel).includes(difficulty)) {
      where = { ...where, difficulty };
    }
    if (status && Object.values(ContentStatus).includes(status)) {
      where = { ...where, status };
    }
    if (createdBy) where = { ...where, createdBy };
    if (tagIds.length) {
      where = {
        ...where,
        tags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      };
    }

    const stories = await prisma.story.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(stories.map(mapStory));
  } catch (err) {
    console.error("Error fetching stories:", err);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

// POST /api/stories - Create new story
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = [{ action: "create", subject: "Story" }];
    const { allowed, error } = await caslGuardWithPolicies(rules, user);
    if (!allowed) {
      return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      lessonId,
      storyType,
      difficulty,
      estimatedMinutes,
      chemRatio,
      tagIds = [],
      status,
    } = body ?? {};

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
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

    const story = await prisma.story.create({
      data: {
        title,
        content,
        storyType: (storyType as StoryType) || StoryType.original,
        difficulty: (difficulty as DifficultyLevel) || DifficultyLevel.beginner,
        estimatedMinutes,
        chemRatio,
        lessonId: lessonId || null,
        tenantId: user.tenantId!,
        createdBy: user.sub,
        status: (status as ContentStatus) || ContentStatus.draft,
        tags: tagIds.length
          ? {
              create: tagIds.map((id: string) => ({ tag: { connect: { id } } })),
            }
          : undefined,
      },
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

    return NextResponse.json(mapStory(story), { status: 201 });
  } catch (err) {
    console.error("Error creating story:", err);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}

