import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/core/auth/getUser";
import { prisma } from "@/core/prisma";
import { z } from "zod";

const audioProgressSchema = z.object({
  storyId: z.string(),
  position: z.number().nonnegative(),
  bookmarks: z
    .array(
      z.object({
        id: z.string(),
        position: z.number().nonnegative(),
        note: z.string().optional(),
      })
    )
    .optional(),
});

// GET /api/learning/progress/audio?storyId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    // Find existing progress
    const progress = await prisma.userProgress.findFirst({
      where: {
        userId: user.id,
        storyId: storyId,
      },
    });

    if (!progress) {
      return NextResponse.json({
        storyId,
        currentPosition: 0,
        bookmarks: [],
        lastUpdated: new Date(),
      });
    }

    // Parse bookmarks from JSON if stored
    let bookmarks = [];
    try {
      bookmarks = progress.metadata
        ? JSON.parse(progress.metadata as string).bookmarks || []
        : [];
    } catch (error) {
      logger.error("Error parsing bookmarks:", undefined, error as Error);
    }

    return NextResponse.json({
      storyId,
      currentPosition: progress.currentPosition || 0,
      bookmarks,
      lastUpdated: progress.updatedAt,
    });
  } catch (error) {
    logger.error("Error fetching audio progress:", undefined, error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/learning/progress/audio
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const validation = audioProgressSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid audio progress data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { storyId, position, bookmarks } = validation.data;

    // Prepare metadata with bookmarks
    const metadata = {
      bookmarks: bookmarks ?? [],
      lastUpdated: new Date(),
    };

    // Upsert progress record
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_storyId: {
          userId: user.id,
          storyId: storyId,
        },
      },
      update: {
        currentPosition: position,
        metadata: JSON.stringify(metadata),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        storyId: storyId,
        currentPosition: position,
        metadata: JSON.stringify(metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      progress: {
        storyId,
        currentPosition: progress.currentPosition,
        bookmarks: metadata.bookmarks,
        lastUpdated: progress.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error saving audio progress:", undefined, error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/learning/progress/audio
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    // Delete progress record
    await prisma.userProgress.deleteMany({
      where: {
        userId: user.id,
        storyId: storyId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error clearing audio progress:", undefined, error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
