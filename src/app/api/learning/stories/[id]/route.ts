import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";

// GET /api/learning/stories/[id] - Get detailed story data with chunks and user progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const storyId = params.id;

    // Fetch story with all related data
    const story = await prisma.story.findUnique({
      where: {
        id: storyId,
        status: "published", // Only show published stories
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            description: true,
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
            storageKey: true,
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
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Get user progress for this story
    let userProgress = null;
    if (story.lessonId) {
      userProgress = await prisma.userProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: story.lessonId,
          },
        },
        select: {
          status: true,
          lastViewedAt: true,
          updatedAt: true,
        },
      });
    }

    // Get learning session data for this story
    const learningSession = await prisma.learningSession.findFirst({
      where: {
        userId: user.id,
        storyId: story.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        timeSpentSec: true,
        interactionCount: true,
        endedAt: true,
      },
    });

    // Format the response
    const response = {
      ...story,
      tags: story.tags.map((st) => st.tag),
      userProgress,
      learningSession,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching story details", { storyId: params.id }, error);
    return NextResponse.json(
      { error: "Failed to fetch story details" },
      { status: 500 }
    );
  }
}
