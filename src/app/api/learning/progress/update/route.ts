import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { z } from "zod";

// Validation schemas
const progressUpdateSchema = z.object({
  lessonId: z.string().uuid(),
  status: z.enum(["not_started", "in_progress", "completed", "paused"]),
  lastViewedAt: z.string().datetime().optional(),
});

const batchProgressUpdateSchema = z.object({
  updates: z.array(progressUpdateSchema),
});

const learningSessionSchema = z.object({
  storyId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  timeSpentSec: z.number().min(0),
  interactionCount: z.number().min(0).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

// POST /api/learning/progress/update - Update user learning progress
export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to update progress
    const rules = [{ action: "update", subject: "UserProgress" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateType = body.type || "lesson_progress"; // lesson_progress, learning_session, batch

    let results = [];

    switch (updateType) {
      case "lesson_progress":
        results = await updateLessonProgress(user.id, body, user.tenantId);
        break;
      case "learning_session":
        results = await updateLearningSession(user.id, body, user.tenantId);
        break;
      case "batch":
        results = await updateBatchProgress(user.id, body, user.tenantId);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid update type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: "Progress updated successfully",
      results,
      updateType,
    });
  } catch (error) {
    logger.error("Error updating progress", { userId: user?.id }, error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// Update lesson progress
async function updateLessonProgress(
  userId: string,
  data: any,
  tenantId?: string
) {
  const validation = progressUpdateSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(
      `Invalid lesson progress data: ${validation.error.message}`
    );
  }

  const { lessonId, status, lastViewedAt } = validation.data;

  // Verify lesson exists
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  // Update or create progress
  const progress = await prisma.userProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      status,
      lastViewedAt: lastViewedAt ? new Date(lastViewedAt) : new Date(),
      updatedAt: new Date(),
    },
    create: {
      userId,
      lessonId,
      status,
      lastViewedAt: lastViewedAt ? new Date(lastViewedAt) : new Date(),
      tenantId: tenantId || "default",
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return [
    {
      type: "lesson_progress",
      lessonId,
      lessonTitle: lesson.title,
      status: progress.status,
      lastViewedAt: progress.lastViewedAt,
      success: true,
    },
  ];
}

// Update learning session
async function updateLearningSession(
  userId: string,
  data: any,
  tenantId?: string
) {
  const validation = learningSessionSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(
      `Invalid learning session data: ${validation.error.message}`
    );
  }

  const {
    storyId,
    lessonId,
    timeSpentSec,
    interactionCount,
    startedAt,
    endedAt,
  } = validation.data;

  if (!storyId && !lessonId) {
    throw new Error("Either storyId or lessonId must be provided");
  }

  // Create or update learning session
  const sessionData = {
    userId,
    ...(storyId && { storyId }),
    ...(lessonId && { lessonId }),
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    endedAt: endedAt ? new Date(endedAt) : new Date(),
    timeSpentSec,
    interactionCount: interactionCount || 1,
    tenantId: tenantId || "default",
  };

  // Find existing session for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingSession = await prisma.learningSession.findFirst({
    where: {
      userId,
      ...(storyId && { storyId }),
      ...(lessonId && { lessonId }),
      startedAt: {
        gte: today,
      },
    },
  });

  let session;
  if (existingSession) {
    // Update existing session
    session = await prisma.learningSession.update({
      where: { id: existingSession.id },
      data: {
        timeSpentSec: existingSession.timeSpentSec + timeSpentSec,
        interactionCount:
          (existingSession.interactionCount || 0) + (interactionCount || 1),
        endedAt: new Date(),
      },
    });
  } else {
    // Create new session
    session = await prisma.learningSession.create({
      data: sessionData,
    });
  }

  return [
    {
      type: "learning_session",
      sessionId: session.id,
      storyId: session.storyId,
      lessonId: session.lessonId,
      timeSpentSec: session.timeSpentSec,
      interactionCount: session.interactionCount,
      success: true,
    },
  ];
}

// Update batch progress (for offline sync)
async function updateBatchProgress(
  userId: string,
  data: any,
  tenantId?: string
) {
  const validation = batchProgressUpdateSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid batch progress data: ${validation.error.message}`);
  }

  const { updates } = validation.data;
  const results = [];

  // Process updates in transaction
  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      try {
        // Verify lesson exists
        const lesson = await tx.lesson.findUnique({
          where: { id: update.lessonId },
          select: { id: true, title: true },
        });

        if (!lesson) {
          results.push({
            type: "lesson_progress",
            lessonId: update.lessonId,
            success: false,
            error: "Lesson not found",
          });
          continue;
        }

        // Update or create progress
        const progress = await tx.userProgress.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId: update.lessonId,
            },
          },
          update: {
            status: update.status,
            lastViewedAt: update.lastViewedAt
              ? new Date(update.lastViewedAt)
              : new Date(),
            updatedAt: new Date(),
          },
          create: {
            userId,
            lessonId: update.lessonId,
            status: update.status,
            lastViewedAt: update.lastViewedAt
              ? new Date(update.lastViewedAt)
              : new Date(),
            tenantId: tenantId || "default",
          },
        });

        results.push({
          type: "lesson_progress",
          lessonId: update.lessonId,
          lessonTitle: lesson.title,
          status: progress.status,
          lastViewedAt: progress.lastViewedAt,
          success: true,
        });
      } catch (updateError) {
        logger.error(
          "Error in batch progress update",
          {
            userId,
            lessonId: update.lessonId,
          },
          updateError
        );

        results.push({
          type: "lesson_progress",
          lessonId: update.lessonId,
          success: false,
          error: "Failed to update progress",
        });
      }
    }
  });

  return results;
}
