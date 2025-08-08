import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/lessons - Lấy danh sách lessons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (level) {
      where.level = level;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        objective: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            stories: true,
            vocabularies: true,
            quizzes: true,
            userResults: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

// POST /api/lessons - Tạo lesson mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, objective, level = "intermediate" } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        objective,
        level,
      },
      select: {
        id: true,
        title: true,
        description: true,
        objective: true,
        level: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
