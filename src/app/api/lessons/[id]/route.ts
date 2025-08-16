import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import type { Prisma, Lesson } from "@prisma/client";
import logger from "@/lib/logger";

export class LessonController {
  // GET /api/lessons/[id]
  static async getLesson(request: NextRequest, params: { id: string }) {
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    try {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          stories: {
            select: {
              id: true,
              title: true,
              storyType: true,
              chemRatio: true,
              createdAt: true,
            },
          },
          vocabularies: {
            select: {
              id: true,
              word: true,
              meaning: true,
              example: true,
            },
          },
          grammarPoints: {
            select: {
              id: true,
              point: true,
              explanation: true,
            },
          },
          quizzes: {
            select: {
              id: true,
              title: true,
              description: true,
              _count: { select: { questions: true } },
            },
          },
          _count: { select: { userResults: true } },
        },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }

      return NextResponse.json(lesson);
    } catch (error) {
      logger.error("Error fetching lesson", undefined, error as Error);
      return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
    }
  }

  // PUT /api/lessons/[id]
  static async updateLesson(request: NextRequest, params: { id: string }) {
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    try {
      const body: Partial<Pick<Lesson, "title" | "status" | "order" | "publishedAt" | "approvedBy">> = await request.json();

      // Prisma type-safe update input
      const data: Prisma.LessonUpdateInput = {
        ...(body.title && { title: body.title }),
        ...(body.status && { status: body.status }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.publishedAt && { publishedAt: body.publishedAt }),
        ...(body.approvedBy && { approvedBy: body.approvedBy }),
      };

      const updatedLesson = await prisma.lesson.update({
        where: { id: lessonId },
        data,
        select: {
          id: true,
          title: true,
          status: true,
          order: true,
          publishedAt: true,
          approvedBy: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(updatedLesson);
    } catch (error) {
      logger.error("Error updating lesson", undefined, error as Error);
      return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
    }
  }

  // DELETE /api/lessons/[id]
  static async deleteLesson(_request: NextRequest, params: { id: string }) {
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    try {
      await prisma.lesson.delete({ where: { id: lessonId } });
      return NextResponse.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      logger.error("Error deleting lesson", undefined, error as Error);
      return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
    }
  }
}
