import { NextRequest, NextResponse } from "next/server";
import { caslGuard, RequiredRule } from "@/core/auth/casl.guard";
import jwt from "jsonwebtoken";

import { prisma } from "@/core/prisma";

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

// GET /api/stories/[id] - Lấy thông tin chi tiết story
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

    const storyId = params.id;

    // Get story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

// PUT /api/stories/[id] - Cập nhật story
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to update a story
    const rules: RequiredRule[] = [{ action: "update", subject: "Story" }];

    // Check if user has required permissions
    const { allowed, error } = caslGuard(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const storyId = params.id;
    const body = await request.json();
    const { title, content, storyType, chemRatio, lessonId } = body;

    // Check if story exists
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!existingStory) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Validate storyType if provided
    const validStoryTypes = [
      "original",
      "chemdanhtu",
      "chemdongtu",
      "chemtinhtu",
      "custom",
    ];
    if (storyType && !validStoryTypes.includes(storyType)) {
      return NextResponse.json(
        {
          error: `Invalid storyType. Must be one of: ${validStoryTypes.join(
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

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (storyType !== undefined) updateData.storyType = storyType;
    if (chemRatio !== undefined) updateData.chemRatio = chemRatio;
    if (lessonId !== undefined) updateData.lessonId = lessonId;

    // Update story
    const story = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
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

    return NextResponse.json(story);
  } catch (error) {
    console.error("Error updating story:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/[id] - Xóa story
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to delete a story
    const rules: RequiredRule[] = [{ action: "delete", subject: "Story" }];

    // Check if user has required permissions
    const { allowed, error } = caslGuard(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const storyId = params.id;

    // Check if story exists
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!existingStory) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Delete story
    await prisma.story.delete({
      where: { id: storyId },
    });

    return NextResponse.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
