import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { STORY_DEFAULTS } from "@/config";
import { generateStoryChunks, calculateStoryStats } from "@/lib/story-chunker";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { z } from "zod";
import { StoryType, DifficultyLevel, Prisma } from "@prisma/client";

const storySchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  lessonId: z.number().int().positive().optional(),
  storyType: z.nativeEnum(StoryType).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  chemRatio: z.number().min(0).max(1).optional(),
});

// GET /api/stories - Lấy danh sách stories với search và filter
export async function GET(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access this endpoint
    const rules = [{ action: "read", subject: "Story" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lessonId = searchParams.get("lessonId");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    let limit = parseInt(searchParams.get("limit") || "20", 10);
    if (isNaN(limit) || limit < 1) {
      limit = 20;
    }
    limit = Math.min(limit, 100);
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: Prisma.StoryWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (lessonId) {
      const lessonIdNum = parseInt(lessonId);
      if (!isNaN(lessonIdNum)) {
        where.lessonId = lessonIdNum;
      }
    }

    const total = await prisma.story.count({ where });

    const stories = await prisma.story.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({ data: stories, meta: { page, limit, total } });
  } catch (error) {
    logger.error("Error fetching stories", undefined, error as Error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

// POST /api/stories - Tạo story mới
export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to create a story
    const rules = [{ action: "create", subject: "Story" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const json = await request.json();
    const validationResult = storySchema.safeParse(json);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      lessonId,
      storyType,
      difficulty,
      estimatedMinutes,
      chemRatio,
    } = validationResult.data;

    // Check if lesson exists if lessonId is provided
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found" },
          { status: 404 }
        );
      }
    }

    // Generate chunks from content and calculate stats
    const chunksData = generateStoryChunks(content);
    const { wordCount, chemRatio: calculatedRatio } = calculateStoryStats(chunksData);

    // Create story with generated chunks
    const story = await prisma.story.create({
      data: {
        title,
        content,
        storyType: storyType || STORY_DEFAULTS.storyType,
        difficulty: difficulty || STORY_DEFAULTS.difficulty,
        estimatedMinutes: estimatedMinutes || STORY_DEFAULTS.estimatedMinutes,
        chemRatio: chemRatio ?? calculatedRatio,
        wordCount,
        lessonId: lessonId || null,
        tenantId: user.tenantId!,
        createdBy: user.sub,
        status: STORY_DEFAULTS.status,
        chunks: {
          create: chunksData.map((chunk, index) => ({
            chunkOrder: index + 1,
            chunkText: chunk.chunkText,
            type: chunk.type,
          })),
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        chunks: {
          select: {
            id: true,
            chunkOrder: true,
            chunkText: true,
            type: true,
          },
          orderBy: {
            chunkOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    logger.error("Error creating story", undefined, error as Error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
