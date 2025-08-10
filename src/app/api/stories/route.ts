import { NextRequest, NextResponse } from "next/server";
import { caslGuard, RequiredRule } from "@/core/auth/casl.guard";
import jwt from "jsonwebtoken";

import { prisma } from "@/core/prisma";
import { StoryType } from "@/core/api/entityRegistry";
import { isValidStoryType, VALID_STORY_TYPES, STORY_DEFAULTS } from "@/config";

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as {
      userId: string;
      email: string;
      role: string;
      tenantId?: string;
    };

    return {
      sub: decoded.userId,
      tenantId: decoded.tenantId,
      roles: [decoded.role],
    };
  } catch (error) {
    return null;
  }
}

// GET /api/stories - Lấy danh sách stories với search và filter
export async function GET(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access this endpoint
    const rules: RequiredRule[] = [{ action: "read", subject: "Story" }];

    // Check if user has required permissions
    const { allowed, error } = caslGuard(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lessonId = searchParams.get("lessonId");

    // Build where clause for search
    const where: any = {};

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

    // Get stories
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
      take: 100, // Limit to 100 stories for now
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
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
    const rules: RequiredRule[] = [{ action: "create", subject: "Story" }];

    // Check if user has required permissions
    const { allowed, error } = caslGuard(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, lessonId, storyType, difficulty, estimatedMinutes, chemRatio } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate storyType if provided
    if (storyType && !isValidStoryType(storyType)) {
      return NextResponse.json(
        {
          error: `Invalid storyType. Must be one of: ${VALID_STORY_TYPES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

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

    // Create story
    const story = await prisma.story.create({
      data: {
        title,
        content,
        storyType: storyType || "original",
        difficulty: difficulty || "beginner",
        estimatedMinutes: estimatedMinutes || 10,
        chemRatio: chemRatio || 0.3,
        lessonId: lessonId || null,
        tenantId: user.tenantId!,
        createdBy: user.sub,
        status: "draft",
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
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
