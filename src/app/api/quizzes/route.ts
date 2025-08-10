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

// GET /api/quizzes - Lấy danh sách quizzes
export async function GET(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access this endpoint
    const rules: RequiredRule[] = [{ action: "read", subject: "Quiz" }];

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

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (lessonId) {
      where.lessonId = parseInt(lessonId);
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            questions: true,
            quizResults: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: 100,
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Tạo quiz mới
export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to create a quiz
    const rules: RequiredRule[] = [{ action: "create", subject: "Quiz" }];

    // Check if user has required permissions
    const { allowed, error } = caslGuard(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, lessonId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Check if lesson exists
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

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || "",
        lessonId: lessonId || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        lessonId: true,
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
