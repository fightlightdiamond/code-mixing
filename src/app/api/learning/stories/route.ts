import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import type { DifficultyLevel, StoryType } from "@prisma/client";

// GET /api/learning/stories - Get stories for learning with filtering
export async function GET(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access stories
    const rules = [{ action: "read", subject: "Story" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") as DifficultyLevel | null;
    const type = searchParams.get("type") as StoryType | null;
    const search = searchParams.get("search");
    const minWords = searchParams.get("minWords");
    const maxWords = searchParams.get("maxWords");

    // Build where clause with proper typing
    const where: {
      status: string;
      difficulty?: DifficultyLevel;
      storyType?: StoryType;
      wordCount?: { gte?: number; lte?: number };
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        content?: { contains: string; mode: "insensitive" };
        lesson?: { title: { contains: string; mode: "insensitive" } };
      }>;
    } = {
      status: "published", // Only show published stories
    };

    // Filter by difficulty level
    if (level) {
      where.difficulty = level;
    }

    // Filter by story type
    if (type) {
      where.storyType = type;
    }

    // Filter by word count
    if (minWords || maxWords) {
      where.wordCount = {};
      if (minWords) {
        where.wordCount.gte = parseInt(minWords);
      }
      if (maxWords) {
        where.wordCount.lte = parseInt(maxWords);
      }
    }

    // Search in title and content
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lesson: {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Fetch stories with related data
    const stories = await prisma.story.findMany({
      where,
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
        audios: {
          select: {
            id: true,
            voiceType: true,
            durationSec: true,
          },
          where: {
            status: "published",
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { difficulty: "asc" }, // Order by difficulty first
        { createdAt: "desc" }, // Then by creation date
      ],
    });

    // Get user progress for stories that have lessons
    const storyIds = stories.map((story) => story.id);
    const lessonIds = stories
      .filter((story) => story.lessonId)
      .map((story) => story.lessonId!);

    const userProgressMap = new Map();
    const learningSessionsMap = new Map();

    if (lessonIds.length > 0) {
      const userProgress = await prisma.userProgress.findMany({
        where: {
          userId: user.sub,
          lessonId: { in: lessonIds },
        },
        select: {
          lessonId: true,
          status: true,
          lastViewedAt: true,
          updatedAt: true,
        },
      });

      userProgress.forEach((progress) => {
        userProgressMap.set(progress.lessonId, progress);
      });
    }

    // Get learning sessions for these stories
    if (storyIds.length > 0) {
      const learningSessions = await prisma.learningSession.findMany({
        where: {
          userId: user.sub,
          storyId: { in: storyIds },
        },
        select: {
          storyId: true,
          timeSpentSec: true,
          interactionCount: true,
          endedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        distinct: ["storyId"],
      });

      learningSessions.forEach((session) => {
        learningSessionsMap.set(session.storyId, session);
      });
    }

    // Enhance stories with user progress and session data
    const enhancedStories = stories.map((story) => ({
      ...story,
      tags: story.tags.map((st) => st.tag),
      userProgress: story.lessonId
        ? userProgressMap.get(story.lessonId) || null
        : null,
      learningSession: learningSessionsMap.get(story.id) || null,
    }));

    return NextResponse.json(enhancedStories);
  } catch (error) {
    logger.error(
      "Error fetching learning stories",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
