import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { caslGuard, RequiredRule } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { Prisma } from "@prisma/client";

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
    const where: Prisma.QuizWhereInput = {};

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
    logger.error("Error fetching quizzes", undefined, error);
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
        tenantId: user.tenantId!,
        createdBy: user.sub,
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
    logger.error("Error creating quiz", undefined, error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
