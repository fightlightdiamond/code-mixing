// src/app/api/lessons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Prisma, LearningLevel } from "@prisma/client";
import { caslGuard, RequiredRule } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";

// GET /api/lessons
export async function GET(request: NextRequest) {
  try {
    // Auth + casl
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "read", subject: "Lesson" }];
    const { allowed, error } = caslGuard(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    // Params
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const levelRaw = (searchParams.get("level") || "").trim();

    // Build where with Prisma type
    let where: Prisma.LessonWhereInput = {
      // multi-tenant guard
      ...(user.tenantId ? { tenantId: user.tenantId } : {}),
    };

    if (search) {
      where = {
        ...where,
        title: { contains: search, mode: "insensitive" },
      };
    }

    if (levelRaw) {
      // Validate levelRaw against enum values
      const allowedLevels = Object.values(LearningLevel) as string[];
      if (!allowedLevels.includes(levelRaw)) {
        return NextResponse.json({ error: `Invalid level: ${levelRaw}` }, { status: 400 });
      }

      // Filter via relation Course.level (schema: Course.level exists)
      where = {
        ...where,
        course: { level: levelRaw as LearningLevel },
      };
    }

    const lessons = await prisma.lesson.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        order: true,
        unitId: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: { id: true, level: true, title: true },
        },
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
  } catch (err) {
    console.error("Error fetching lessons:", err);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

// POST /api/lessons
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rules: RequiredRule[] = [{ action: "create", subject: "Lesson" }];
    const { allowed, error } = caslGuard(rules, user);
    if (!allowed) return NextResponse.json({ error: error || "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      title,
      unitId,
      courseId,
      order,
      status = "draft", // per schema default
    } = body ?? {};

    // Basic validation
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!unitId) return NextResponse.json({ error: "unitId is required" }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    if (typeof order !== "number") {
      return NextResponse.json({ error: "order (number) is required" }, { status: 400 });
    }
    if (!user.tenantId) {
      return NextResponse.json({ error: "tenantId (from token) is required" }, { status: 400 });
    }

    // Ensure unit & course exist and belong to same tenant
    const [unit, course] = await Promise.all([
      prisma.unit.findUnique({
        where: { id: unitId },
        select: { tenantId: true, courseId: true },
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: { tenantId: true, id: true },
      }),
    ]);

    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    if (unit.tenantId !== user.tenantId || course.tenantId !== user.tenantId) {
      return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
    }

    if (unit.courseId !== courseId) {
      return NextResponse.json(
          { error: "unitId does not belong to the provided courseId" },
          { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        unitId,
        courseId,
        order,
        tenantId: user.tenantId,
        status,
        createdBy: user.sub,
      },
      select: {
        id: true,
        title: true,
        status: true,
        order: true,
        unitId: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
        course: { select: { id: true, level: true, title: true } },
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (err) {
    console.error("Error creating lesson:", err);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
